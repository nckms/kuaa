export interface LearningAnswer {
  difficulty: number
  isCorrect: boolean
  answeredAt: Date
  timeSpentMs: number | null
}

export interface AdaptiveActivity {
  recentAnswersCount: number
  recentAccuracy: number | null
  recentAverageDifficulty: number | null
  recentAverageTimeMs: number | null
  timedAnswersCount: number
  lastAnsweredAt: string | null
}

export interface Recommendation {
  topicId: string
  reason: string
  kind: 'reinforcement' | 'continue' | 'advance'
  targetDifficulty?: number
}

export function summarizeActivity(answers: LearningAnswer[], now = new Date()): AdaptiveActivity {
  const recent = answers.filter((answer) => answer.answeredAt.getTime() <= now.getTime()
    && answer.answeredAt.getTime() >= now.getTime() - 30 * 86400000)
    .sort((a, b) => b.answeredAt.getTime() - a.answeredAt.getTime())
  // Include timestamp ties: simulado answers share their finish timestamp.
  const cutoff = recent[9]?.answeredAt.getTime() ?? -Infinity
  const sample = recent.filter((answer) => answer.answeredAt.getTime() >= cutoff)
  const timed = sample.filter((answer) => answer.timeSpentMs != null
    && Number.isFinite(answer.timeSpentMs) && answer.timeSpentMs > 0)
  return {
    recentAnswersCount: sample.length,
    recentAccuracy: sample.length ? sample.filter((answer) => answer.isCorrect).length / sample.length : null,
    recentAverageDifficulty: sample.length ? sample.reduce((sum, answer) => sum + answer.difficulty, 0) / sample.length : null,
    recentAverageTimeMs: timed.length ? timed.reduce((sum, answer) => sum + answer.timeSpentMs!, 0) / timed.length : null,
    timedAnswersCount: timed.length,
    lastAnsweredAt: recent[0]?.answeredAt.toISOString() ?? null,
  }
}

interface Candidate {
  id: string
  progress: { masteryLevel: number; completed: boolean; unlocked: boolean }
  activity: AdaptiveActivity
}

export function recommendTopic(topics: Candidate[]): Recommendation | null {
  const gaps = topics.filter(({ activity: a }) => a.recentAnswersCount >= 5 && a.recentAccuracy! < 0.7)
    .map((topic) => {
      const a = topic.activity
      const difficulty = a.recentAverageDifficulty!
      // Time only breaks close reinforcement priorities; it never creates a gap.
      const slow = a.timedAnswersCount >= 3 && a.recentAverageTimeMs! > 60000 * difficulty
      const score = (1 - a.recentAccuracy!) * 100
        + Math.max(0, topic.progress.masteryLevel - difficulty) * 5 + (slow ? 3 : 0)
      return { topic, score, slow }
    })
    .sort((a, b) => b.score - a.score
      || (b.topic.activity.lastAnsweredAt ?? '').localeCompare(a.topic.activity.lastAnsweredAt ?? ''))
  if (gaps[0]) {
    const { topic, slow } = gaps[0]
    const a = topic.activity
    return {
      topicId: topic.id,
      kind: 'reinforcement',
      targetDifficulty: Math.max(1, Math.min(5, Math.round(a.recentAverageDifficulty!) - (a.recentAccuracy! < 0.4 ? 1 : 0))),
      reason: `${Math.round(a.recentAccuracy! * 100)}% de acerto nas ${a.recentAnswersCount} respostas recentes, com dificuldade media ${a.recentAverageDifficulty!.toFixed(1)}. Reforce este topico${slow ? ' com mais tempo para resolver e revisar os erros' : ' antes de avancar'}.`,
    }
  }
  const next = topics.find((topic) => topic.progress.unlocked && !topic.progress.completed)
  if (!next) return null
  return {
    topicId: next.id,
    kind: next.activity.recentAnswersCount ? 'continue' : 'advance',
    targetDifficulty: Math.max(1, Math.min(5, next.progress.masteryLevel || 1)),
    reason: next.activity.recentAnswersCount
      ? 'Continue este topico para consolidar o aprendizado; ainda nao ha evidencia recente suficiente de necessidade de reforco.'
      : 'Proximo topico disponivel na sua trilha. Comece para avaliar seu conhecimento.',
  }
}
