// Nota TRI do ENEM, calculada como o INEP calcula: modelo logístico de 3 parâmetros (a, b, c)
// com os parâmetros oficiais de cada item (microdados), estimativa EAP com priori N(0, 1) e
// conversão para a escala do ENEM. Validado com 3 mil participantes reais do ENEM 2023: diferença
// média de até 1,8 ponto para a nota oficial. Quem não acerta nenhuma questão da área recebe 0.
// Ver scripts/official/build-tri.py.
import fs from 'node:fs'
import path from 'node:path'

export type Area = 'CN' | 'CH' | 'LC' | 'MT'
interface TriFile {
  scale: Record<Area, [number, number]>
  params: Record<string, [number, number, number, Area]>
  keyFixes: Record<string, string>
  annulled: string[]
}

let cache: TriFile | null = null
export function triData(): TriFile {
  if (!cache) {
    const file = path.resolve(process.cwd(), 'prisma/official/tri.json')
    cache = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) as TriFile
      : { scale: { CN: [500, 100], CH: [500, 100], LC: [500, 100], MT: [500, 100] }, params: {}, keyFixes: {}, annulled: [] }
  }
  return cache
}

const QUAD = Array.from({ length: 121 }, (_, k) => -4 + (8 * k) / 120)

/** Proficiência (theta) por EAP e desvio-padrão da posteriori (incerteza da estimativa). */
export function eapPosterior(items: Array<{ a: number; b: number; c: number; correct: boolean }>): { theta: number; sd: number } {
  const logPost = QUAD.map((q) => -0.5 * q * q)
  for (const it of items) {
    for (let k = 0; k < QUAD.length; k++) {
      const p = it.c + (1 - it.c) / (1 + Math.exp(-it.a * (QUAD[k]! - it.b)))
      logPost[k]! += Math.log(it.correct ? p : 1 - p)
    }
  }
  const max = Math.max(...logPost)
  const w = logPost.map((l) => Math.exp(l - max))
  const sum = w.reduce((s, x) => s + x, 0)
  const theta = w.reduce((s, x, k) => s + x * QUAD[k]!, 0) / sum
  const variance = w.reduce((s, x, k) => s + x * (QUAD[k]! - theta) ** 2, 0) / sum
  return { theta, sd: Math.sqrt(variance) }
}

/** Proficiência (theta) por EAP: média da posteriori numa grade de -4 a 4. */
export function eapTheta(items: Array<{ a: number; b: number; c: number; correct: boolean }>): number {
  const logPost = QUAD.map((q) => -0.5 * q * q)
  for (const it of items) {
    for (let k = 0; k < QUAD.length; k++) {
      const p = it.c + (1 - it.c) / (1 + Math.exp(-it.a * (QUAD[k]! - it.b)))
      logPost[k]! += Math.log(it.correct ? p : 1 - p)
    }
  }
  const max = Math.max(...logPost)
  const w = logPost.map((l) => Math.exp(l - max))
  const sum = w.reduce((s, x) => s + x, 0)
  return w.reduce((s, x, k) => s + x * QUAD[k]!, 0) / sum
}

export const AREA_LABEL: Record<Area, string> = { LC: 'Linguagens', CH: 'Ciências Humanas', CN: 'Ciências da Natureza', MT: 'Matemática' }
/** Mínimo de itens com parâmetro para mostrar a nota da área (a prova tem 45). */
export const MIN_ITEMS = 30

export interface AreaScore { area: Area; label: string; score: number; correct: number; items: number }

/**
 * Nota estimada por área para as respostas dadas (em branco conta como erro, como no ENEM).
 * `isCorrect(questionId, chosen)` decide o acerto com o gabarito do banco.
 */
export function scoreAreas(questionIds: string[], answers: Record<string, string>, isCorrect: (id: string, chosen: string | undefined) => boolean): AreaScore[] {
  const { params, scale } = triData()
  const byArea = new Map<Area, Array<{ a: number; b: number; c: number; correct: boolean }>>()
  for (const id of questionIds) {
    const p = params[id]
    if (!p) continue
    const [a, b, c, area] = p
    const list = byArea.get(area) ?? []
    list.push({ a, b, c, correct: isCorrect(id, answers[id]) })
    byArea.set(area, list)
  }
  const result: AreaScore[] = []
  for (const [area, items] of byArea) {
    if (items.length < MIN_ITEMS) continue
    const correct = items.filter((i) => i.correct).length
    const [k0, k1] = scale[area]
    const score = correct === 0 ? 0 : Math.round((k0 + k1 * eapTheta(items)) * 10) / 10
    result.push({ area, label: AREA_LABEL[area], score, correct, items: items.length })
  }
  return result.sort((x, y) => ['LC', 'CH', 'CN', 'MT'].indexOf(x.area) - ['LC', 'CH', 'CN', 'MT'].indexOf(y.area))
}
