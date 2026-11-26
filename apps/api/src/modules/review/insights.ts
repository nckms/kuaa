// Raio-X dos erros. O aluno diz, em um toque, por que errou (grátis, ajuda o próprio caderno).
// O Plus recebe o relatório: o padrão dominante dos últimos 30 dias, por matéria, e 3 ações
// concretas para a semana, escritas pela IA a partir desses números.
import { Router, type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'
import { aiAvailable, generate } from '../../lib/ai'
import { prisma } from '../../lib/prisma'
import { requireAuth } from '../../middleware/requireAuth'
import { makeError } from '../../utils/errors'
import { effectivePlan } from '../plans/entitlements'

export const REASONS = ['conteudo', 'leitura', 'conta', 'duvida', 'tempo'] as const
export type Reason = (typeof REASONS)[number] | 'sem-motivo'
export const REASON_LABEL: Record<Reason, string> = {
  conteudo: 'Não sabia o conteúdo', leitura: 'Me confundi na leitura', conta: 'Errei a conta',
  duvida: 'Fiquei entre duas', tempo: 'Chutei / pressa', 'sem-motivo': 'Sem motivo informado',
}
const FAST_MS = 15_000
const WINDOW_DAYS = 30

/** Motivo do erro: o que o aluno disse; sem resposta, resposta em menos de 15 s conta como pressa. */
export function inferReason(answer: { mistakeReason: string | null; timeSpentMs: number }): Reason {
  if (answer.mistakeReason && (REASONS as readonly string[]).includes(answer.mistakeReason)) return answer.mistakeReason as Reason
  return answer.timeSpentMs > 0 && answer.timeSpentMs < FAST_MS ? 'tempo' : 'sem-motivo'
}

async function setReason(req: Request, res: Response, next: NextFunction) {
  try {
    const { reason } = z.object({ reason: z.enum(REASONS) }).strict().parse(req.body)
    const updated = await prisma.userAnswer.updateMany({
      where: { userId: req.userId!, sessionId: String(req.params.sessionId), questionId: String(req.params.questionId), isCorrect: false },
      data: { mistakeReason: reason },
    })
    if (!updated.count) throw makeError('Resposta errada não encontrada.', 404, 'NOT_FOUND')
    res.status(204).end()
  } catch (err) { next(err) }
}

export interface MistakeReport {
  windowDays: number; wrong: number; answered: number
  reasons: { reason: Reason; label: string; count: number }[]
  bySubject: { subject: string; wrong: number; topReason: Reason; topReasonLabel: string }[]
  dominant: Reason | null; avgWrongSeconds: number | null; fastWrong: number
}

export async function buildMistakeReport(userId: string, now = new Date()): Promise<MistakeReport> {
  const since = new Date(now.getTime() - WINDOW_DAYS * 86_400_000)
  const answers = await prisma.userAnswer.findMany({
    where: { userId, answeredAt: { gte: since } },
    select: { isCorrect: true, timeSpentMs: true, mistakeReason: true, question: { select: { topic: { select: { subject: { select: { name: true } } } } } } },
  })
  const wrong = answers.filter((a) => !a.isCorrect)
  const counts = new Map<Reason, number>()
  const subjects = new Map<string, Map<Reason, number>>()
  for (const a of wrong) {
    const r = inferReason(a)
    counts.set(r, (counts.get(r) ?? 0) + 1)
    const name = a.question.topic.subject.name
    const m = subjects.get(name) ?? new Map<Reason, number>()
    m.set(r, (m.get(r) ?? 0) + 1)
    subjects.set(name, m)
  }
  const top = (m: Map<Reason, number>, skipUnknown: boolean) => [...m.entries()].filter(([r]) => !skipUnknown || r !== 'sem-motivo').sort((a, b) => b[1] - a[1])[0]?.[0]
  const dominant = top(counts, true) ?? null
  return {
    windowDays: WINDOW_DAYS, wrong: wrong.length, answered: answers.length,
    reasons: [...counts.entries()].map(([reason, count]) => ({ reason, label: REASON_LABEL[reason], count })).sort((a, b) => b.count - a.count),
    bySubject: [...subjects.entries()].map(([subject, m]) => {
      const r = top(m, true) ?? 'sem-motivo'
      return { subject, wrong: [...m.values()].reduce((s, n) => s + n, 0), topReason: r, topReasonLabel: REASON_LABEL[r] }
    }).sort((a, b) => b.wrong - a.wrong).slice(0, 8),
    dominant,
    avgWrongSeconds: wrong.length ? Math.round(wrong.reduce((s, a) => s + a.timeSpentMs, 0) / wrong.length / 1000) : null,
    fastWrong: wrong.filter((a) => a.timeSpentMs > 0 && a.timeSpentMs < FAST_MS).length,
  }
}

const planSchema = z.object({ actions: z.array(z.string().min(10).max(300)).min(1).max(3) })
const planCache = new Map<string, { at: number; actions: string[] }>()

async function weeklyActions(userId: string, report: MistakeReport): Promise<string[]> {
  const key = `${userId}:${report.wrong}:${report.dominant}`
  const cached = planCache.get(key)
  if (cached && Date.now() - cached.at < 6 * 3600_000) return cached.actions
  if (!aiAvailable() || report.wrong < 5) return []
  try {
    const text = await generate({
      task: 'chat', json: true, maxOutputTokens: 600, timeoutMs: 20_000,
      input: `Você é um orientador de estudos para o ENEM. Com base nos erros dos últimos ${report.windowDays} dias de um aluno, escreva de 1 a 3 ações concretas para esta semana (cada uma com o que fazer, quanto e quando; sem prometer nota).
Erros por motivo: ${report.reasons.map((r) => `${r.label}: ${r.count}`).join('; ')}.
Erros por matéria e motivo mais comum: ${report.bySubject.map((s) => `${s.subject}: ${s.wrong} (${s.topReasonLabel})`).join('; ')}.
Tempo médio nas questões erradas: ${report.avgWrongSeconds ?? '?'} s; erros respondidos em menos de 15 s: ${report.fastWrong}.
Responda SOMENTE JSON: {"actions": ["...", "..."]}`,
    })
    const actions = planSchema.parse(JSON.parse(text || '{}')).actions
    planCache.set(key, { at: Date.now(), actions })
    return actions
  } catch (error) {
    console.warn('[Insights] plano falhou', (error as Error).message?.slice(0, 120))
    return []
  }
}

async function mistakes(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { plan: true, planExpiresAt: true } })
    const report = await buildMistakeReport(userId)
    if (effectivePlan(user) !== 'PLUS') {
      // Gratuito vê quantos erros tem e o convite; o padrão e o plano ficam no Plus.
      res.status(402).json({ error: 'O Raio-X dos erros é do Kuaa Plus.', code: 'PLUS_REQUIRED', upgrade: '/planos', teaser: { wrong: report.wrong, windowDays: report.windowDays } })
      return
    }
    res.json({ ...report, actions: await weeklyActions(userId, report) })
  } catch (err) { next(err) }
}

export const insightsRouter = Router()
insightsRouter.get('/mistakes', requireAuth, mistakes)
insightsRouter.patch('/answers/:sessionId/:questionId/reason', requireAuth, setReason)
