// Índice Kuaa na escala do ENEM: nota TRI estimada por área com TODAS as questões oficiais que o aluno
// respondeu (trilha, revisão, diagnóstico, simulado e provas anteriores), com os parâmetros do INEP.
// Cada questão entra uma vez, pela primeira resposta: refazer depois de ver o gabarito não infla a nota.
// Com poucas questões a estimativa fica perto de 500 (média da escala) e a margem é larga; a margem
// mostrada é o desvio-padrão da posteriori convertido para pontos.
import { prisma } from '../../lib/prisma'
import { readDiagnostic } from '../diagnostic/diagnostic.engine'
import { acceptedOptionIds } from '../exams/exams'
import type { QuestionOption } from '../quiz/quiz.types'
import { AREA_LABEL, eapPosterior, triData, type Area } from '../exams/tri'
import type { StoredQuestion } from '../simulado/simulado.results'

export interface TriResponse { id: string; correct: boolean; at: Date }
export interface TriAreaScore { area: Area; label: string; score: number | null; margin: number | null; items: number; correct: number; needed: number }
export interface TriIndex {
  /** Média das 4 áreas (como a média do ENEM sem redação); só quando todas têm questões suficientes. */
  overall: number | null
  areas: TriAreaScore[]
  totalItems: number
  delta7d: number | null
  history: Array<{ month: string; score: number }>
}

export const MIN_AREA_ITEMS = 10
const AREAS: Area[] = ['LC', 'CH', 'CN', 'MT']
const PT_MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const round1 = (n: number) => Math.round(n * 10) / 10

/** Primeira resposta a cada questão oficial (pelo id do banco), de todas as fontes. */
export async function collectTriResponses(userId: string, vestibularId: string): Promise<TriResponse[]> {
  const { params } = triData()
  const [answers, simulados, exams, enrollment] = await Promise.all([
    prisma.userAnswer.findMany({
      where: { userId, question: { topic: { subject: { vestibularId } } } },
      select: { isCorrect: true, answeredAt: true, question: { select: { id: true, officialRefId: true } } },
    }),
    prisma.simuladoAttempt.findMany({ where: { userId, vestibularId, finishedAt: { not: null } }, select: { questions: true, answers: true, finishedAt: true } }),
    prisma.examAttempt.findMany({ where: { userId, exam: 'enem', finishedAt: { not: null } }, select: { questionIds: true, answers: true, finishedAt: true } }),
    prisma.enrollment.findFirst({ where: { userId, vestibularId }, select: { diagnostic: true, enrolledAt: true } }),
  ])
  const all: TriResponse[] = []
  for (const a of answers) all.push({ id: a.question.officialRefId ?? a.question.id, correct: a.isCorrect, at: a.answeredAt })
  for (const s of simulados) {
    const chosen = s.answers as Record<string, string>
    for (const q of s.questions as unknown as StoredQuestion[]) {
      const pick = chosen[q.id]
      if (!pick || !params[q.id]) continue
      all.push({ id: q.id, correct: Boolean(q.options.find((o) => o.id === pick)?.isCorrect), at: s.finishedAt! })
    }
  }
  const examIds = [...new Set(exams.flatMap((e) => (e.questionIds as string[]).filter((id) => params[id] && (e.answers as Record<string, string>)[id])))]
  if (examIds.length) {
    const options = new Map((await prisma.question.findMany({ where: { id: { in: examIds } }, select: { id: true, options: true } }))
      .map((q) => [q.id, q.options as unknown as QuestionOption[]]))
    for (const e of exams) {
      const chosen = e.answers as Record<string, string>
      // Em branco não entra: a prova pode ter sido entregue pela metade (no ENEM contaria como erro).
      for (const id of e.questionIds as string[]) {
        const pick = chosen[id]
        if (!pick || !options.has(id)) continue
        all.push({ id, correct: acceptedOptionIds(options.get(id)!).includes(pick), at: e.finishedAt! })
      }
    }
  }
  const diag = readDiagnostic(enrollment?.diagnostic)
  if (diag) {
    const at = diag.finishedAt ? new Date(diag.finishedAt) : enrollment!.enrolledAt
    for (const answer of diag.answers) {
      const q = diag.pool.find((item) => item.id === answer.questionId)
      if (!q || !answer.optionId || !params[q.id]) continue
      all.push({ id: q.id, correct: Boolean(q.options.find((o) => o.id === answer.optionId)?.isCorrect), at })
    }
  }
  const first = new Map<string, TriResponse>()
  for (const r of all) {
    if (!params[r.id]) continue
    const prev = first.get(r.id)
    if (!prev || r.at < prev.at) first.set(r.id, r)
  }
  return [...first.values()]
}

/** Nota por área e média, considerando as respostas até `asOf`. */
export function computeTriIndex(responses: TriResponse[], asOf = new Date()): Omit<TriIndex, 'delta7d' | 'history'> {
  const { params, scale } = triData()
  const byArea = new Map<Area, Array<{ a: number; b: number; c: number; correct: boolean }>>()
  for (const r of responses) {
    if (r.at > asOf) continue
    const [a, b, c, area] = params[r.id]!
    const list = byArea.get(area) ?? []
    list.push({ a, b, c, correct: r.correct })
    byArea.set(area, list)
  }
  const areas = AREAS.map((area): TriAreaScore => {
    const items = byArea.get(area) ?? []
    const correct = items.filter((i) => i.correct).length
    if (items.length < MIN_AREA_ITEMS) return { area, label: AREA_LABEL[area], score: null, margin: null, items: items.length, correct, needed: MIN_AREA_ITEMS - items.length }
    const [k0, k1] = scale[area]
    const { theta, sd } = eapPosterior(items)
    return { area, label: AREA_LABEL[area], score: round1(k0 + k1 * theta), margin: Math.round(k1 * sd), items: items.length, correct, needed: 0 }
  })
  const ready = areas.filter((a) => a.score != null)
  return {
    overall: ready.length === AREAS.length ? round1(ready.reduce((s, a) => s + a.score!, 0) / ready.length) : null,
    areas,
    totalItems: areas.reduce((s, a) => s + a.items, 0),
  }
}

export async function getTriIndex(userId: string, vestibularId: string, now = new Date()): Promise<TriIndex> {
  const responses = await collectTriResponses(userId, vestibularId)
  const current = computeTriIndex(responses, now)
  const weekAgo = computeTriIndex(responses, new Date(now.getTime() - 7 * 86_400_000))
  const delta7d = current.overall != null && weekAgo.overall != null ? round1(current.overall - weekAgo.overall) : null
  // Evolução: a média no fim de cada um dos últimos 8 meses em que ela já existia.
  const history: TriIndex['history'] = []
  for (let back = 7; back >= 0; back--) {
    const end = back === 0 ? now : new Date(now.getFullYear(), now.getMonth() - back + 1, 1)
    const point = computeTriIndex(responses, end).overall
    if (point != null) history.push({ month: PT_MONTHS[(end.getMonth() + (back === 0 ? 0 : 11)) % 12]!, score: point })
  }
  return { ...current, delta7d, history }
}
