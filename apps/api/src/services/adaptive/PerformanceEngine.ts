import { z } from 'zod'
import { computeNewLevel } from './DifficultyEngine'

const EvidenceSchema = z.object({
  isCorrect: z.boolean(),
  difficulty: z.number().int().min(1).max(5),
  timeSpentMs: z.number().nonnegative().nullable(),
  answered: z.boolean(),
  observedAt: z.string().datetime(),
})
const SummarySchema = z.object({
  previousLevel: z.number().int().min(0).max(5),
  newLevel: z.number().int().min(0).max(5),
  evidenceCount: z.number().int().nonnegative(),
  pendingAnswers: z.number().int().min(0).max(4),
  accuracy: z.number().min(0).max(1).nullable(),
  decision: z.enum(['advance', 'reinforce', 'maintain', 'collect']),
  reason: z.string(),
})
const StateSchema = z.object({
  version: z.literal(1),
  pending: z.array(EvidenceSchema).max(75),
  summary: SummarySchema,
})

export type PerformanceEvidence = z.infer<typeof EvidenceSchema>
export type PerformanceSummary = z.infer<typeof SummarySchema>

export function readPerformance(metadata: unknown) {
  const parsed = z.object({ performance: StateSchema }).safeParse(metadata)
  return parsed.success ? parsed.data.performance : null
}

/** Consume evidence once per assessment; short sessions carry into the next one. */
export function assessPerformance(
  currentLevel: number,
  pending: PerformanceEvidence[],
  session: PerformanceEvidence[],
  now = new Date(),
): z.infer<typeof StateSchema> {
  const isRecentEvidence = (item: PerformanceEvidence) => {
    const age = now.getTime() - Date.parse(item.observedAt)
    return age >= 0 && age <= 30 * 86400000
      && (!item.answered || item.timeSpentMs == null || item.timeSpentMs >= 1000)
  }
  const eligibleSession = session.filter(isRecentEvidence)
  const recent = [...pending.filter(isRecentEvidence),
    ...(eligibleSession.some((item) => item.answered) ? eligibleSession : [])]
  const answers = recent.filter((item) => item.answered)
  const accuracy = recent.length ? recent.filter((item) => item.isCorrect).length / recent.length : null
  const enough = answers.length >= 5
  const averageDifficulty = answers.length
    ? answers.reduce((sum, answer) => sum + answer.difficulty, 0) / answers.length : 1
  const newLevel = enough ? computeNewLevel(currentLevel, accuracy!, averageDifficulty, {
    answeredCount: answers.length,
  }) : currentLevel
  const decision = !enough ? 'collect' : newLevel > currentLevel ? 'advance'
    : accuracy! < 0.7 ? 'reinforce' : 'maintain'
  const reason = !enough
    ? `Mais ${5 - answers.length} resposta(s) neste tópico para avaliar a evolução. As sessões curtas também contam.`
    : decision === 'advance'
      ? 'Seu desempenho sustentou um avanço no domínio deste tópico. A próxima prática poderá trazer questões mais difíceis.'
      : decision === 'reinforce'
        ? 'Os erros indicam necessidade de reforço. Revise as explicações e pratique este tópico novamente.'
        : accuracy! >= 0.8 && newLevel < 5
          ? 'Bom resultado. É preciso acertar questões de maior dificuldade para avançar neste tópico.'
          : 'Seu nível foi mantido. Continue praticando para consolidar o aprendizado.'
  return {
    version: 1,
    pending: enough ? [] : recent,
    summary: { previousLevel: currentLevel, newLevel, evidenceCount: answers.length,
      pendingAnswers: enough ? 0 : answers.length, accuracy, decision, reason },
  }
}
