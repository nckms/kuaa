export function computeNewLevel(current: number, accuracy: number, avgDifficulty: number): number {
  if (accuracy >= 0.80 && avgDifficulty >= current) return Math.min(5, current + 1)
  if (accuracy < 0.40) return Math.max(0, current - 1)
  return current
}
