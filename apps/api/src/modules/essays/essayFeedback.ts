import { z } from 'zod'
import { ai } from '../../lib/gemini'
import { env } from '../../lib/env'
import { makeError } from '../../utils/errors'

export const feedbackSchema = z.object({
  overview: z.string().min(20).max(1200),
  strengths: z.array(z.string().min(8).max(500)).min(1).max(3),
  criteria: z.array(z.object({
    name: z.enum(['Tema e gênero', 'Argumentação', 'Organização', 'Linguagem']),
    observation: z.string().min(15).max(700),
    nextStep: z.string().min(15).max(700),
  }).strict()).length(4),
  revisionPlan: z.array(z.string().min(10).max(500)).min(2).max(4),
}).strict()

export type EssayFeedback = z.infer<typeof feedbackSchema>

export async function generateEssayFeedback(input: { exam: string; theme: string; prompt: string; textType: string; body: string }): Promise<EssayFeedback> {
  if (!env.GEMINI_API_KEY?.trim()) throw makeError('Analise por IA indisponivel no momento.', 503, 'AI_UNAVAILABLE')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 30_000)
  try {
    const response = await ai.models.generateContent({
      model: env.SABIA_MODEL,
      config: { responseMimeType: 'application/json', maxOutputTokens: 1600,
        abortSignal: controller.signal, httpOptions: { timeout: 30_000 } },
      contents: `Você é um tutor de escrita. Analise este texto de prática para ${input.exam}.
Não atribua nota, pontuação, competência oficial ou aprovação. O feedback é formativo, sujeito a erro, e deve usar evidências presentes no texto. Não invente citações, repertório ou fatos. Se houver pouca evidência para um critério, indique a limitação. Não reescreva a redação inteira.
Devolva SOMENTE JSON com overview, strengths (1 a 3 frases), criteria (exatamente quatro objetos, um para cada nome: Tema e gênero, Argumentação, Organização, Linguagem; cada um com observation e nextStep) e revisionPlan (2 a 4 ações específicas).
Proposta: ${input.theme}. Gênero: ${input.textType}. Comando: ${input.prompt}
Texto do aluno, delimitado abaixo:
<texto>
${input.body}
</texto>`,
    })
    if (!response.text) throw new Error('Resposta vazia')
    const parsed = feedbackSchema.parse(JSON.parse(response.text))
    if (new Set(parsed.criteria.map((item) => item.name)).size !== 4) throw new Error('Critérios duplicados')
    return parsed
  } catch (error) {
    const status = typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : undefined
    console.warn('[EssayFeedback] generation failed', { model: env.SABIA_MODEL, status: status ?? 'timeout-or-invalid' })
    throw makeError('Nao foi possivel analisar o texto agora. Ele permanece salvo; tente novamente.', 503, 'AI_UNAVAILABLE')
  } finally {
    clearTimeout(timer)
  }
}
