export const INDEX_BANDS = [
  { from: 300, to: 499, range: '300–499', name: 'Iniciante' },
  { from: 500, to: 699, range: '500–699', name: 'Básico' },
  { from: 700, to: 849, range: '700–849', name: 'Forte' },
  { from: 850, to: 1000, range: '850+', name: 'Elite' },
] as const

export function indexBand(score: number) {
  const index = INDEX_BANDS.findIndex((band) => score >= band.from && score <= band.to)
  const position = index < 0 ? (score > 1000 ? INDEX_BANDS.length - 1 : 0) : index
  return { ...INDEX_BANDS[position]!, index: position, next: INDEX_BANDS[position + 1] ?? null }
}

/** Pontos "x,y" para um polyline de largura w e altura h. */
export function sparkPoints(values: number[], w: number, h: number, pad = 4) {
  if (values.length < 2) return ''
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  return values.map((value, index) => `${((index / (values.length - 1)) * w).toFixed(1)},${(pad + (h - pad * 2) - ((value - min) / span) * (h - pad * 2)).toFixed(1)}`).join(' ')
}

export function formatStudyTime(ms: number) {
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h${String(rest).padStart(2, '0')}` : `${hours}h`
}

/** Mesma fórmula da API: nível = floor(sqrt(xp / 100)) + 1. */
export function levelProgress(xp: number) {
  const level = Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1
  const start = 100 * (level - 1) ** 2
  const next = 100 * level ** 2
  return { level, start, next, left: next - xp, pct: Math.round(((xp - start) / (next - start)) * 100) }
}

export function topicProgressScore(topic: { progress: { completed: boolean; sessionsCount: number; answeredQuestionsCount: number } }) {
  if (topic.progress.completed) return 1
  if (topic.progress.sessionsCount > 0 || topic.progress.answeredQuestionsCount > 0) return 0.5
  return 0
}
