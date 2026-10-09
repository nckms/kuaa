import { z } from 'zod'
import references from '../../data/exam-references.json'
import type { GenerationJobData } from './quiz.types'

export interface ExamReference {
  id: string
  vestibularSlug: string
  year: number
  topicTags: string[]
  subjectName: string
  skill: string
  difficulty: number
  body: string
  options: Array<{ id: string; text: string; isCorrect: boolean }>
  explanation: string
  sourceUrl: string
  provenance: string
}

export const PROMPT_VERSION = 'few-shot-v1'
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function selectReferences(data: GenerationJobData): ExamReference[] {
  const exam = normalize(data.vestibularSlug ?? data.vestibularName)
  const topic = normalize(`${data.topicName} ${data.subjectName}`)
  return (references as ExamReference[])
    .filter((reference) => exam.includes(reference.vestibularSlug))
    .map((reference) => ({ reference, score:
      reference.topicTags.reduce((score, tag) => score + (topic.includes(normalize(tag)) ? 3 : 0), 0)
      + (normalize(reference.subjectName) === normalize(data.subjectName) ? 4 : 0),
    }))
    .sort((a, b) => b.score - a.score || a.reference.id.localeCompare(b.reference.id))
    .slice(0, 3)
    .map(({ reference }) => reference)
}

export function buildFewShotContext(data: GenerationJobData, selected = selectReferences(data)): string {
  return `REFERENCIAS DIDATICAS ADAPTADAS (nao sao transcricoes oficiais):
${JSON.stringify(selected.map((reference) => ({
    id: reference.id, vestibular: reference.vestibularSlug, year: reference.year,
    skill: reference.skill, topicTags: reference.topicTags, source: reference.sourceUrl,
    body: reference.body, options: reference.options, explanation: reference.explanation,
    difficulty: reference.difficulty,
  })))}
Use os exemplos apenas como demonstracoes de estilo, raciocinio e qualidade de distratores.
Quando a habilidade do exemplo nao corresponder ao topico solicitado, use apenas o estilo.
Crie situacoes e valores novos; nao copie os enunciados. Nao diga que as novas questoes sao oficiais.
O topico solicitado tem prioridade sobre o assunto dos exemplos.
Revise o raciocinio, a resposta e cada distrator antes de devolver o JSON.`
}

const questionSchema = z.object({
  body: z.string().trim().min(10).max(12000),
  options: z.array(z.object({
    id: z.enum(['A', 'B', 'C', 'D', 'E']),
    text: z.string().trim().min(1).max(4000),
    isCorrect: z.boolean(),
  })).min(4).max(5),
  explanation: z.string().trim().min(20).max(12000),
  difficulty: z.number().int().min(1).max(5),
}).superRefine((question, ctx) => {
  const uniqueIds = new Set(question.options.map((option) => option.id))
  const uniqueTexts = new Set(question.options.map((option) => normalize(option.text)))
  if (question.options.filter((option) => option.isCorrect).length !== 1
    || uniqueIds.size !== question.options.length || uniqueTexts.size !== question.options.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Alternativas duplicadas ou gabarito ambiguo' })
  }
})

export function validateGeneratedQuestions(value: unknown, count: number, selected: ExamReference[] = [], optionCount = 5) {
  const result = z.object({ questions: z.array(questionSchema).length(count) }).parse(value)
  const bodies = result.questions.map((question) => normalize(question.body))
  if (new Set(bodies).size !== count || bodies.some((body) => selected.some((ref) => normalize(ref.body) === body))) {
    throw new Error('Questoes repetidas ou copiadas das referencias')
  }
  if (result.questions.some((question) => question.options.length !== optionCount)) {
    throw new Error('Quantidade de alternativas incompativel com a prova')
  }
  return result.questions
}
