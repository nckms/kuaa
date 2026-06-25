export function computeNewLevel(current: number, accuracy: number, avgDifficulty: number): number {
  if (accuracy >= 0.80) return Math.min(5, Math.max(current + 2, 3))
  if (accuracy >= 0.60) return Math.min(5, Math.max(current + 1, 2))
  if (accuracy >= 0.40) return Math.max(current, 1)
  if (accuracy < 0.40) return Math.max(0, current - 1)
  return current
}
