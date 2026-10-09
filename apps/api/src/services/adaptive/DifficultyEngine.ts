export interface LevelEvidence {
  answeredCount: number
  averageTimeMs?: number | null
}

/** Accuracy is 0..1; difficulty is 1..5. Pass evidence to guard small/empty sessions. */
export function computeNewLevel(
  current: number,
  accuracy: number,
  avgDifficulty: number,
  evidence?: LevelEvidence,
): number {
  const level = Number.isFinite(current) ? Math.max(0, Math.min(5, Math.round(current))) : 0
  if (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 1
    || !Number.isFinite(avgDifficulty) || avgDifficulty < 1 || avgDifficulty > 5) return level
  if (evidence && (!Number.isFinite(evidence.answeredCount) || evidence.answeredCount < 5)) return level
  // Three arguments cannot distinguish a blank session from all incorrect answers.
  if (!evidence && accuracy === 0) return level
  const time = evidence?.averageTimeMs
  const rushed = time != null && Number.isFinite(time) && time >= 0 && time < 1000
  if (accuracy >= 0.8 && avgDifficulty >= Math.max(1, level) && !rushed) {
    return Math.min(5, level + 1)
  }
  if (accuracy < 0.4 && avgDifficulty <= Math.max(1, level) && !rushed) {
    return Math.max(0, level - 1)
  }
  return level
}
