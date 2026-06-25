import { Worker, Job } from 'bullmq'
import { redis } from '../lib/redis'
import { prisma } from '../lib/prisma'
import { openai } from '../lib/openai'
import { getBullMQConnection } from '../lib/bullmqConnection'
import type { GenerationJobData, GeneratedQuestion } from '../modules/quiz/quiz.types'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

// Schema de validação da resposta da IA
const OptionSchema = z.object({
  id: z.enum(['A', 'B', 'C', 'D', 'E']),
  text: z.string().min(1),
  isCorrect: z.boolean(),
})

const QuestionSchema = z.object({
  body: z.string().min(10),
  options: z.array(OptionSchema).length(5),
  explanation: z.string().min(20),
  difficulty: z.number().int().min(1).max(5),
})

const ResponseSchema = z.object({
  questions: z.array(QuestionSchema).min(1),
})

// Questões mock de fallback (usadas quando OpenAI não está disponível)
function generateMockQuestions(data: GenerationJobData): GeneratedQuestion[] {
  return Array.from({ length: data.questionCount }, (_, i) => ({
    body: `[QUESTÃO DEMONSTRAÇÃO ${i + 1}] Sobre o tópico "${data.topicName}": qual das afirmativas a seguir está correta segundo os principais conceitos estudados?`,
    options: [
      { id: 'A' as const, text: 'A primeira alternativa apresenta um exemplo introdutório do tema.', isCorrect: false },
      { id: 'B' as const, text: 'A segunda alternativa corresponde ao conceito principal do tópico.', isCorrect: true },
      { id: 'C' as const, text: 'A terceira alternativa mistura conceitos de áreas distintas.', isCorrect: false },
      { id: 'D' as const, text: 'A quarta alternativa apresenta uma informação parcialmente correta.', isCorrect: false },
      { id: 'E' as const, text: 'A quinta alternativa contradiz as definições fundamentais.', isCorrect: false },
    ],
    explanation: `Esta é uma questão de demonstração sobre "${data.topicName}". A alternativa B está correta pois representa o conceito central do tópico conforme o programa do ${data.vestibularName}. Em uma sessão real, esta explicação seria gerada por IA com detalhes específicos sobre o conteúdo.`,
    difficulty: Math.min(5, data.userMasteryLevel + 1),
  }))
}

async function generateWithAI(data: GenerationJobData): Promise<GeneratedQuestion[]> {
  const hasApiKey = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 10

  if (!hasApiKey) {
    console.log('[QuizWorker] OPENAI_API_KEY não configurada — usando questões mockadas')
    return generateMockQuestions(data)
  }

  const systemPrompt = `Você é um professor especialista em vestibulares brasileiros.
Gere questões de múltipla escolha no padrão do vestibular solicitado.

REGRAS OBRIGATÓRIAS:
1. Linguagem acessível para estudantes de escolas públicas
2. Contextos da realidade brasileira contemporânea
3. Exatamente 5 alternativas (A-E), apenas 1 correta
4. difficulty de 1 a 5, proporcional ao masteryLevel informado
5. explanation deve ENSINAR o conceito, mínimo 2 linhas

Retorne APENAS JSON válido sem markdown, exatamente neste formato:
{
  "questions": [
    {
      "body": "enunciado completo",
      "options": [
        { "id": "A", "text": "alternativa", "isCorrect": false },
        { "id": "B", "text": "alternativa", "isCorrect": true },
        { "id": "C", "text": "alternativa", "isCorrect": false },
        { "id": "D", "text": "alternativa", "isCorrect": false },
        { "id": "E", "text": "alternativa", "isCorrect": false }
      ],
      "explanation": "explicação didática e completa",
      "difficulty": 2
    }
  ]
}`

  const userPrompt = `Vestibular: ${data.vestibularName}
Matéria: ${data.subjectName}
Tópico: ${data.topicName}
Nível de maestria do aluno: ${data.userMasteryLevel}/5
Questões a gerar: ${data.questionCount}
${data.recentErrorTopics.length > 0 ? `Tópicos com dificuldade recente (reforçar): ${data.recentErrorTopics.join(', ')}` : ''}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 4000,
    temperature: 0.7,
  })

  const content = completion.choices[0]?.message?.content
  if (!content) throw new Error('OpenAI retornou resposta vazia')

  const parsed = JSON.parse(content) as unknown
  const validated = ResponseSchema.parse(parsed)
  return validated.questions as GeneratedQuestion[]
}

const worker = new Worker<GenerationJobData>(
  'quiz-generation',
  async (job: Job<GenerationJobData>) => {
    const data = job.data
    console.log(`[QuizWorker] Processando job ${job.id} para sessão ${data.sessionId}`)

    try {
      const questions = await generateWithAI(data)

      // Criar questões no banco
      await prisma.question.createMany({
        data: questions.map((q) => ({
          topicId: data.topicId,
          generatedForSessionId: data.sessionId,
          body: q.body,
          options: q.options as unknown as Prisma.InputJsonValue,
          explanation: q.explanation,
          difficulty: q.difficulty,
          source: 'AI_GENERATED',
        })),
      })

      // Marcar sessão como pronta no Redis
      await redis.set(`session:ready:${data.sessionId}`, '1', 'EX', 3600)
      console.log(`[QuizWorker] Sessão ${data.sessionId} pronta`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error(`[QuizWorker] Erro no job ${job.id}:`, message)
      await redis.set(`session:error:${data.sessionId}`, message, 'EX', 3600)
      throw err
    }
  },
  {
    connection: getBullMQConnection(),
    concurrency: 3,
  },
)

worker.on('completed', (job) => {
  console.log(`[QuizWorker] Job ${job.id} concluído`)
})

worker.on('failed', (job, err) => {
  console.error(`[QuizWorker] Job ${job?.id} falhou:`, err.message)
})

export { worker }
