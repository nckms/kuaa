import { prisma } from '../../lib/prisma'

const PT_MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

// Peso por dificuldade: d1=1.0, d2=1.5, d3=2.0, d4=2.5, d5=3.0
function difficultyWeight(difficulty: number): number {
  return 0.5 + 0.5 * difficulty
}

export async function calculateScore(userId: string, vestibularId: string): Promise<number> {
  const answers = await prisma.userAnswer.findMany({
    where: {
      userId,
      question: { topic: { subject: { vestibularId } } },
    },
    select: {
      isCorrect: true,
      question: { select: { difficulty: true } },
    },
  })

  if (answers.length === 0) return 300

  let totalWeight = 0
  let correctWeight = 0
  for (const a of answers) {
    const w = difficultyWeight(a.question.difficulty)
    totalWeight += w
    if (a.isCorrect) correctWeight += w
  }

  return Math.round(300 + 700 * (correctWeight / totalWeight))
}

async function calculateSubjectScores(userId: string, vestibularId: string): Promise<Record<string, number>> {
  const answers = await prisma.userAnswer.findMany({
    where: {
      userId,
      question: { topic: { subject: { vestibularId } } },
    },
    select: {
      isCorrect: true,
      question: {
        select: {
          difficulty: true,
          topic: { select: { subject: { select: { id: true } } } },
        },
      },
    },
  })

  const bySubject: Record<string, { correctWeight: number; totalWeight: number }> = {}
  for (const a of answers) {
    const subjectId = a.question.topic.subject.id
    if (!bySubject[subjectId]) bySubject[subjectId] = { correctWeight: 0, totalWeight: 0 }
    const w = difficultyWeight(a.question.difficulty)
    bySubject[subjectId].totalWeight += w
    if (a.isCorrect) bySubject[subjectId].correctWeight += w
  }

  const result: Record<string, number> = {}
  for (const [subjectId, { correctWeight, totalWeight }] of Object.entries(bySubject)) {
    result[subjectId] = totalWeight > 0 ? Math.round((correctWeight / totalWeight) * 100) : 0
  }
  return result
}

export function getFaixa(score: number): string {
  if (score < 500) return 'iniciante'
  if (score < 700) return 'básico'
  if (score < 850) return 'forte'
  return 'elite'
}

export async function captureSnapshot(userId: string, vestibularId: string): Promise<void> {
  const score = await calculateScore(userId, vestibularId)
  const subjectScores = await calculateSubjectScores(userId, vestibularId)
  await prisma.indexSnapshot.create({
    data: { userId, vestibularId, score, subjectScores },
  })
}

async function getOldSnapshot(userId: string, vestibularId: string) {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  return prisma.indexSnapshot.findFirst({
    where: { userId, vestibularId, capturedAt: { lte: sevenDaysAgo } },
    orderBy: { capturedAt: 'desc' },
    select: { score: true, subjectScores: true },
  })
}

async function calculateSubjectBreakdown(userId: string, vestibularId: string) {
  const [subjects, currentScores, oldSnapshot] = await Promise.all([
    prisma.subject.findMany({
      where: { vestibularId },
      select: { id: true, name: true },
      orderBy: { order: 'asc' },
    }),
    calculateSubjectScores(userId, vestibularId),
    getOldSnapshot(userId, vestibularId),
  ])

  const oldSubjectScores = (oldSnapshot?.subjectScores ?? {}) as Record<string, number>

  return subjects
    .filter((s) => s.id in currentScores)
    .map((s) => {
      const score = currentScores[s.id] ?? 0
      const oldScore = oldSubjectScores[s.id] ?? score
      return { subjectId: s.id, subjectName: s.name, score, delta: score - oldScore }
    })
}

async function getPercentile(userId: string, vestibularId: string, score: number): Promise<number | null> {
  const enrollments = await prisma.enrollment.findMany({
    where: { vestibularId },
    select: { userId: true },
  })

  // Mínimo de 5 usuários para ter significância estatística
  if (enrollments.length < 5) return null

  const otherUserIds = enrollments.map((e) => e.userId).filter((id) => id !== userId)

  // Pega o snapshot mais recente de cada usuário (performance)
  const latestSnapshots = await prisma.indexSnapshot.findMany({
    where: { userId: { in: otherUserIds }, vestibularId },
    orderBy: { capturedAt: 'desc' },
    distinct: ['userId'],
    select: { userId: true, score: true },
  })
  const snapshotMap = new Map(latestSnapshots.map((s) => [s.userId, s.score]))

  let scoredBelow = 0
  for (const uid of otherUserIds) {
    // Sem snapshot: calcula on-the-fly
    const otherScore = snapshotMap.has(uid)
      ? snapshotMap.get(uid)!
      : await calculateScore(uid, vestibularId)
    if (otherScore < score) scoredBelow++
  }

  const totalOthers = otherUserIds.length
  return totalOthers > 0 ? Math.round((scoredBelow / totalOthers) * 100) : null
}

async function getHistoryChart(userId: string, vestibularId: string): Promise<Array<{ month: string; score: number }>> {
  const eightMonthsAgo = new Date()
  eightMonthsAgo.setMonth(eightMonthsAgo.getMonth() - 8)

  const snapshots = await prisma.indexSnapshot.findMany({
    where: { userId, vestibularId, capturedAt: { gte: eightMonthsAgo } },
    orderBy: { capturedAt: 'asc' },
    select: { score: true, capturedAt: true },
  })

  // Agrupa por mês, mantendo o snapshot mais recente de cada mês
  const byMonth = new Map<string, { score: number; date: Date }>()
  for (const snap of snapshots) {
    const key = `${snap.capturedAt.getFullYear()}-${snap.capturedAt.getMonth()}`
    const existing = byMonth.get(key)
    if (!existing || snap.capturedAt > existing.date) {
      byMonth.set(key, { score: snap.score, date: snap.capturedAt })
    }
  }

  return Array.from(byMonth.values()).map(({ score, date }) => ({
    month: PT_MONTHS[date.getMonth()] ?? '',
    score,
  }))
}

export async function getIndexData(userId: string, vestibularId: string) {
  const [score, subjectBreakdown, history, oldSnapshot] = await Promise.all([
    calculateScore(userId, vestibularId),
    calculateSubjectBreakdown(userId, vestibularId),
    getHistoryChart(userId, vestibularId),
    getOldSnapshot(userId, vestibularId),
  ])

  const faixa = getFaixa(score)
  const delta7d = oldSnapshot ? score - (oldSnapshot.score as number) : 0
  const percentile = await getPercentile(userId, vestibularId, score)

  return { score, faixa, subjectBreakdown, percentile, delta7d, history }
}
