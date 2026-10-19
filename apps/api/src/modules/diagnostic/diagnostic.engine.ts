import { z } from 'zod'
import type { GeneratedQuestion } from '../quiz/quiz.types'

export const profileSchema = z.object({
  schoolStage: z.enum(['fundamental', 'medio', 'concluido']),
  examHorizon: z.enum(['este-ano', 'proximo-ano', 'explorando']),
  weeklyMinutes: z.union([z.literal(60), z.literal(180), z.literal(300), z.literal(600)]),
  difficultSubjects: z.array(z.string().min(1)).max(16),
}).strict()
export type StudyProfile = z.infer<typeof profileSchema>
export interface DiagnosticItem extends GeneratedQuestion {
  id: string; topicId: string; subjectId: string; subjectName: string; area: string
}
export interface DiagnosticAnswer { questionId: string; optionId: string | null }
export interface DiagnosticArea { key: string; name: string; subjectIds: string[] }
export interface DiagnosticState {
  version: 1; profile: StudyProfile; areas: DiagnosticArea[]; pool: DiagnosticItem[];
  answers: DiagnosticAnswer[]; currentId: string | null; finishedAt: string | null
}
export function readDiagnostic(value: unknown): DiagnosticState | null {
  if (!value || typeof value !== 'object' || !('version' in value) || value.version !== 1) return null
  return value as DiagnosticState
}
export function summarizeDiagnostic(state: DiagnosticState) {
  return state.areas.map((area) => {
    const observations = state.answers.flatMap((answer) => {
      const question = state.pool.find((item) => item.id === answer.questionId && item.area === area.key)
      return question ? [{ question, answer, correct: question.options.some((option) => option.id === answer.optionId && option.isCorrect) }] : []
    })
    const correct = observations.filter((item) => item.correct).length
    const skipped = observations.filter((item) => item.answer.optionId === null).length
    const accuracy = observations.length ? correct / observations.length : 0
    const averageDifficulty = observations.length ? observations.reduce((sum, item) => sum + item.question.difficulty, 0) / observations.length : 1
    const targetDifficulty = accuracy < 0.4 ? 1 : accuracy < 0.7 ? 2 : Math.min(3, Math.max(2, Math.round(averageDifficulty + 0.5)))
    return { key: area.key, name: area.name, answered: observations.length, correct, skipped, targetDifficulty, confidence: 'initial' as const }
  })
}
export function nextDiagnosticItem(state: DiagnosticState): DiagnosticItem | null {
  if (state.answers.length >= 12) return null
  const area = state.areas[state.answers.length % state.areas.length]!
  const previous = [...state.answers].reverse().find((answer) => state.pool.some((q) => q.id === answer.questionId && q.area === area.key))
  const previousQuestion = state.pool.find((q) => q.id === previous?.questionId)
  const target = previousQuestion ? Math.max(1, Math.min(3, previousQuestion.difficulty
    + (previousQuestion.options.some((o) => o.id === previous?.optionId && o.isCorrect) ? 1 : -1))) : 2
  const seen = new Set(state.answers.map((a) => a.questionId))
  const sampledSubjects = new Set(state.pool.filter((q) => seen.has(q.id) && q.area === area.key).map((q) => q.subjectId))
  return state.pool.filter((q) => q.area === area.key && !seen.has(q.id))
    .sort((a, b) => Math.abs(a.difficulty - target) - Math.abs(b.difficulty - target)
      || Number(sampledSubjects.has(a.subjectId)) - Number(sampledSubjects.has(b.subjectId)))[0] ?? null
}

// Diagnostic priors never overwrite mastery. Real practice takes precedence.
export function initialDifficulty(value: unknown, subjectId: string): number | undefined {
  const state = readDiagnostic(value)
  if (!state?.finishedAt) return undefined
  const area = state.areas.find((item) => item.subjectIds.includes(subjectId))
  return summarizeDiagnostic(state).find((item) => item.key === area?.key)?.targetDifficulty
}
