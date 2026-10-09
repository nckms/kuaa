import { prisma } from '../../lib/prisma'

export const SIMULADO_DURATION_SECONDS = 90 * 60

export interface StoredQuestion {
  id: string
  order: number
  subjectId: string
  subjectName: string
  subjectSlug: string
  // Optional for attempts created before topic metadata was stored.
  topicId?: string
  difficulty?: number
  source?: string
  explanation?: string
  body: string
  options: Array<{ id: string; text: string; isCorrect: boolean }>
}

export function scoreAttempt(questions: StoredQuestion[], answers: Record<string, string>) {
  let correct = 0
  let wrong = 0
  for (const question of questions) {
    const selected = question.options.find((option) => option.id === answers[question.id])
    if (!selected) continue
    if (selected.isCorrect) correct++
    else wrong++
  }
  const total = questions.length
  return { score: total ? Math.round(300 + 700 * correct / total) : 300, correct, wrong, total }
}

export async function getCompletedSimuladoActivity(userId: string, vestibularId: string) {
  const attempts = await prisma.simuladoAttempt.findMany({
    where: { userId, vestibularId, finishedAt: { not: null } },
    select: { id: true, questions: true, answers: true, startedAt: true, finishedAt: true },
  })

  // Old attempts can recover topic metadata from bank questions. Inline legacy
  // questions keep their subject, without inventing a topic for the diagnosis.
  const legacyIds = attempts.flatMap((attempt) => (attempt.questions as unknown as StoredQuestion[])
    .filter((question) => !question.topicId).map((question) => question.id))
  const legacyQuestions = legacyIds.length ? await prisma.question.findMany({
    where: { id: { in: legacyIds }, topic: { subject: { vestibularId } } },
    select: { id: true, topicId: true, difficulty: true },
  }) : []
  const legacyById = new Map(legacyQuestions.map((question) => [question.id, question]))

  return attempts.map((attempt) => {
    const finishedAt = attempt.finishedAt!
    const answers = attempt.answers as Record<string, string>
    return {
      id: attempt.id,
      finishedAt,
      studyTimeMs: Math.max(0, Math.min(
        finishedAt.getTime() - attempt.startedAt.getTime(),
        SIMULADO_DURATION_SECONDS * 1000,
      )),
      answers: (attempt.questions as unknown as StoredQuestion[]).flatMap((question) => {
        const selected = question.options.find((option) => option.id === answers[question.id])
        if (!selected) return []
        const legacy = legacyById.get(question.id)
        return [{
          topicId: question.topicId ?? legacy?.topicId ?? null,
          subjectId: question.subjectId,
          difficulty: question.difficulty ?? legacy?.difficulty ?? 2,
          isCorrect: selected.isCorrect,
          answeredAt: finishedAt,
        }]
      }),
    }
  })
}
