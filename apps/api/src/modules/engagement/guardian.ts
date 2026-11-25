// Responsável do aluno: o aluno cadastra um e-mail, o responsável confirma e passa a receber,
// todo dia 1, o resumo do mês anterior. O aluno vê a prévia exata e pode remover quando quiser.
import crypto from 'node:crypto'
import { Router, type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { env } from '../../lib/env'
import { mailDeliveryConfigured, sendMail } from '../../lib/mailer'
import { requireAuth } from '../../middleware/requireAuth'
import { makeError } from '../../utils/errors'

export const GUARDIAN_REPORT_KIND = 'guardian-monthly'
const CONFIRM_TTL_MS = 7 * 86_400_000
const BRT_OFFSET_MS = 3 * 3600_000
const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']

const appUrl = () => (env.APP_URL ?? 'http://localhost:5173').replace(/\/$/, '')
const hash = (token: string) => crypto.createHash('sha256').update(token).digest('hex')
const firstName = (name: string) => name.trim().split(/\s+/)[0] || 'O aluno'
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

const signUnsub = (id: string) => crypto.createHmac('sha256', env.JWT_SECRET).update(`guardian-unsubscribe:${id}`).digest('base64url')
export const guardianUnsubscribeToken = (guardianId: string) => `${Buffer.from(guardianId).toString('base64url')}.${signUnsub(guardianId)}`
function verifyUnsub(token: string): string | null {
  const [encoded, mac] = token.split('.')
  if (!encoded || !mac) return null
  const id = Buffer.from(encoded, 'base64url').toString('utf8')
  const expected = Buffer.from(signUnsub(id))
  const given = Buffer.from(mac)
  return expected.length === given.length && crypto.timingSafeEqual(expected, given) ? id : null
}

/** Mês no horário de Brasília: início e fim em UTC e a chave "2026-11". */
export function brtMonth(year: number, month: number) {
  const start = new Date(Date.UTC(year, month, 1) + BRT_OFFSET_MS)
  const end = new Date(Date.UTC(year, month + 1, 1) + BRT_OFFSET_MS)
  return { start, end, key: `${year}-${String(month + 1).padStart(2, '0')}`, label: `${MONTHS[month]} de ${year}` }
}
export function previousBrtMonth(now = new Date()) {
  const local = new Date(now.getTime() - BRT_OFFSET_MS)
  const y = local.getUTCFullYear(); const m = local.getUTCMonth()
  return m === 0 ? brtMonth(y - 1, 11) : brtMonth(y, m - 1)
}
export function currentBrtMonth(now = new Date()) {
  const local = new Date(now.getTime() - BRT_OFFSET_MS)
  return brtMonth(local.getUTCFullYear(), local.getUTCMonth())
}

export interface GuardianReport {
  studentFirstName: string; periodLabel: string; partial: boolean
  daysStudied: number; questions: number; correct: number; wrong: number; accuracy: number | null
  bySubject: { subject: string; questions: number; accuracy: number }[]
  examsFinished: number; reviewDue: number; reviewResolved: number
}

/** Números do período. Mesma função para a prévia do aluno e para o e-mail. */
export async function buildGuardianReport(userId: string, start: Date, end: Date, partial = false): Promise<GuardianReport> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true } })
  const answers = await prisma.userAnswer.findMany({
    where: { userId, answeredAt: { gte: start, lt: end } },
    select: { isCorrect: true, answeredAt: true, question: { select: { topic: { select: { subject: { select: { name: true } } } } } } },
  })
  const exams = await prisma.examAttempt.findMany({ where: { userId, finishedAt: { gte: start, lt: end } }, select: { finishedAt: true, correct: true, wrong: true } })
  const days = new Set<string>()
  const dayKey = (d: Date) => new Date(d.getTime() - BRT_OFFSET_MS).toISOString().slice(0, 10)
  const subjects = new Map<string, { questions: number; correct: number }>()
  let correct = 0; let wrong = 0
  for (const a of answers) {
    days.add(dayKey(a.answeredAt))
    if (a.isCorrect) correct++; else wrong++
    const name = a.question.topic.subject.name
    const row = subjects.get(name) ?? { questions: 0, correct: 0 }
    row.questions++; if (a.isCorrect) row.correct++
    subjects.set(name, row)
  }
  for (const e of exams) { if (e.finishedAt) days.add(dayKey(e.finishedAt)); correct += e.correct ?? 0; wrong += e.wrong ?? 0 }
  const questions = correct + wrong
  const [reviewDue, reviewResolved] = await Promise.all([
    prisma.reviewItem.count({ where: { userId, resolvedAt: null, dueAt: { lte: end } } }),
    prisma.reviewItem.count({ where: { userId, resolvedAt: { gte: start, lt: end } } }),
  ])
  return {
    studentFirstName: firstName(user.name), periodLabel: '', partial,
    daysStudied: days.size, questions, correct, wrong, accuracy: questions ? Math.round((correct / questions) * 100) : null,
    bySubject: [...subjects.entries()].map(([subject, r]) => ({ subject, questions: r.questions, accuracy: Math.round((r.correct / r.questions) * 100) }))
      .sort((a, b) => b.questions - a.questions).slice(0, 6),
    examsFinished: exams.length, reviewDue, reviewResolved,
  }
}

export function buildGuardianEmail(r: GuardianReport, unsubscribeUrl: string) {
  const who = r.studentFirstName
  const subject = `${who} no Kuaa em ${r.periodLabel}`
  const summary = r.questions
    ? `${who} estudou em ${r.daysStudied} ${r.daysStudied === 1 ? 'dia' : 'dias'} e respondeu ${r.questions} questões, com ${r.accuracy}% de acerto (${r.correct} certas, ${r.wrong} erradas).`
    : `${who} não respondeu questões no Kuaa em ${r.periodLabel}.`
  const extras = [
    r.examsFinished ? `Fez ${r.examsFinished} ${r.examsFinished === 1 ? 'prova anterior completa' : 'provas anteriores completas'} do ENEM.` : null,
    r.reviewResolved ? `Dominou ${r.reviewResolved} ${r.reviewResolved === 1 ? 'questão' : 'questões'} que tinha errado antes.` : null,
    r.reviewDue ? `${r.reviewDue} ${r.reviewDue === 1 ? 'questão errada espera' : 'questões erradas esperam'} revisão.` : null,
  ].filter(Boolean) as string[]
  const subjectLines = r.bySubject.map((s) => `${s.subject}: ${s.questions} questões, ${s.accuracy}% de acerto`)
  const text = [
    `Olá! Este é o resumo de ${r.periodLabel} de ${who} no Kuaa, plataforma de estudo para o ENEM e vestibulares.`, '',
    summary, ...extras, '', ...(subjectLines.length ? ['Por matéria:', ...subjectLines, ''] : []),
    'Os números são do uso do Kuaa e não preveem a nota da prova.', '', '—', 'Kuaa',
    `Você recebe este e-mail porque ${who} cadastrou e você confirmou este endereço. Parar de receber: ${unsubscribeUrl}`,
  ].join('\n')
  const rows = r.bySubject.map((s) => `<tr><td style="padding:4px 12px 4px 0">${escapeHtml(s.subject)}</td><td style="padding:4px 12px 4px 0">${s.questions}</td><td style="padding:4px 0">${s.accuracy}%</td></tr>`).join('')
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#1E1424;max-width:560px">
<p>Olá! Este é o resumo de <strong>${escapeHtml(r.periodLabel)}</strong> de ${escapeHtml(who)} no Kuaa, plataforma de estudo para o ENEM e vestibulares.</p>
<p>${escapeHtml(summary)}</p>
${extras.map((e) => `<p style="margin:6px 0">${escapeHtml(e)}</p>`).join('')}
${rows ? `<table style="border-collapse:collapse;font-size:15px;margin:12px 0"><tr style="color:#5C5160;text-align:left"><th style="padding:4px 12px 4px 0">Matéria</th><th style="padding:4px 12px 4px 0">Questões</th><th style="padding:4px 0">Acerto</th></tr>${rows}</table>` : ''}
<p style="font-size:13px;color:#5C5160">Os números são do uso do Kuaa e não preveem a nota da prova.</p>
<p style="font-size:13px;color:#5C5160">Você recebe este e-mail porque ${escapeHtml(who)} cadastrou e você confirmou este endereço. <a href="${unsubscribeUrl}" style="color:#5C5160">Parar de receber</a></p>
</div>`
  return { subject, text, html }
}

function buildConfirmEmail(studentName: string, confirmUrl: string) {
  const who = firstName(studentName)
  const subject = `${who} quer compartilhar os estudos no Kuaa com você`
  const text = [
    `Olá! ${who} estuda para o ENEM e vestibulares no Kuaa e cadastrou este e-mail como responsável.`, '',
    'Se você confirmar, vai receber uma vez por mês um resumo: dias estudados, questões respondidas, acertos e erros por matéria.',
    `Confirmar: ${confirmUrl}`, '',
    'Se você não conhece quem cadastrou, ignore esta mensagem: nada será enviado.', '', '—', 'Kuaa',
  ].join('\n')
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#1E1424;max-width:520px">
<p>Olá! <strong>${escapeHtml(who)}</strong> estuda para o ENEM e vestibulares no Kuaa e cadastrou este e-mail como responsável.</p>
<p>Se você confirmar, vai receber uma vez por mês um resumo: dias estudados, questões respondidas, acertos e erros por matéria.</p>
<p><a href="${confirmUrl}" style="display:inline-block;background:#FFDC5C;color:#35143E;font-weight:bold;padding:12px 22px;border-radius:999px;text-decoration:none">Confirmar e receber o resumo</a></p>
<p style="font-size:13px;color:#5C5160">Se você não conhece quem cadastrou, ignore esta mensagem: nada será enviado.</p>
</div>`
  return { subject, text, html }
}

const status = (g: { confirmedAt: Date | null; unsubscribedAt: Date | null } | null) =>
  !g ? null : g.unsubscribedAt ? 'unsubscribed' : g.confirmedAt ? 'confirmed' : 'pending'

async function getGuardian(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!
    const g = await prisma.guardian.findUnique({ where: { userId } })
    const month = currentBrtMonth()
    const preview = await buildGuardianReport(userId, month.start, new Date(), true)
    preview.periodLabel = month.label
    res.json({ guardian: g ? { email: g.email, status: status(g), confirmedAt: g.confirmedAt } : null, preview, mailConfigured: mailDeliveryConfigured() })
  } catch (err) { next(err) }
}

async function setGuardian(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!
    const { email } = z.object({ email: z.string().trim().toLowerCase().email().max(200) }).strict().parse(req.body)
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true, name: true } })
    if (email === user.email.toLowerCase()) throw makeError('Use o e-mail do responsável, não o seu.', 400, 'SAME_EMAIL')
    const current = await prisma.guardian.findUnique({ where: { userId } })
    if (current && Date.now() - current.updatedAt.getTime() < 60_000) throw makeError('Espere um minuto antes de mudar o responsável de novo.', 429, 'TOO_SOON')
    const token = crypto.randomBytes(32).toString('base64url')
    const data = { email, confirmTokenHash: hash(token), confirmedAt: null, unsubscribedAt: null }
    await prisma.guardian.upsert({ where: { userId }, create: { userId, ...data }, update: data })
    const sent = await sendMail({ to: email, ...buildConfirmEmail(user.name, `${appUrl()}/responsavel#confirmar=${token}`) })
    res.json({ guardian: { email, status: 'pending', confirmedAt: null }, confirmationSent: sent })
  } catch (err) { next(err) }
}

async function removeGuardian(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.guardian.deleteMany({ where: { userId: req.userId! } })
    res.status(204).end()
  } catch (err) { next(err) }
}

async function confirmGuardian(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = z.object({ token: z.string().min(20).max(200) }).parse(req.body)
    const g = await prisma.guardian.findUnique({ where: { confirmTokenHash: hash(token) }, include: { user: { select: { name: true } } } })
    if (!g || g.unsubscribedAt || (!g.confirmedAt && Date.now() - g.updatedAt.getTime() > CONFIRM_TTL_MS)) {
      throw makeError('Link inválido ou expirado. Peça ao aluno para cadastrar o e-mail de novo.', 400, 'INVALID_TOKEN')
    }
    if (!g.confirmedAt) await prisma.guardian.update({ where: { id: g.id }, data: { confirmedAt: new Date() } })
    res.json({ studentFirstName: firstName(g.user.name), unsubscribeToken: guardianUnsubscribeToken(g.id) })
  } catch (err) { next(err) }
}

async function unsubscribeGuardian(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = z.object({ token: z.string().min(10).max(300) }).parse(req.body)
    const id = verifyUnsub(token)
    if (!id) throw makeError('Link inválido.', 400, 'INVALID_TOKEN')
    await prisma.guardian.updateMany({ where: { id, unsubscribedAt: null }, data: { unsubscribedAt: new Date() } })
    res.json({ ok: true })
  } catch (err) { next(err) }
}

export interface GuardianRunResult { eligible: number; sent: number; skippedAlreadySent: number; failed: number }

/** Envia o resumo do mês anterior aos responsáveis confirmados. Idempotente por mês (EmailLog). */
export async function runGuardianReports(options: { dryRun: boolean; now?: Date }): Promise<GuardianRunResult> {
  const month = previousBrtMonth(options.now)
  const guardians = await prisma.guardian.findMany({
    where: { confirmedAt: { not: null }, unsubscribedAt: null },
    include: { user: { select: { emailLogs: { where: { kind: GUARDIAN_REPORT_KIND, periodKey: month.key }, select: { id: true } } } } },
  })
  const result: GuardianRunResult = { eligible: 0, sent: 0, skippedAlreadySent: 0, failed: 0 }
  for (const g of guardians) {
    if (g.user.emailLogs.length) { result.skippedAlreadySent++; continue }
    result.eligible++
    if (options.dryRun) continue
    try {
      const report = await buildGuardianReport(g.userId, month.start, month.end)
      report.periodLabel = month.label
      const mail = buildGuardianEmail(report, `${appUrl()}/responsavel#sair=${guardianUnsubscribeToken(g.id)}`)
      await prisma.emailLog.create({ data: { userId: g.userId, kind: GUARDIAN_REPORT_KIND, periodKey: month.key } })
      if (await sendMail({ to: g.email, ...mail })) result.sent++
      else {
        result.failed++
        await prisma.emailLog.deleteMany({ where: { userId: g.userId, kind: GUARDIAN_REPORT_KIND, periodKey: month.key } })
      }
    } catch { result.failed++ }
  }
  return result
}

/** Confere de hora em hora; envia no dia 1, a partir das 10h de Brasília (idempotente no banco). */
export function startGuardianScheduler(): NodeJS.Timeout | null {
  if (env.NODE_ENV === 'test' || !mailDeliveryConfigured()) return null
  const tick = () => {
    const local = new Date(Date.now() - BRT_OFFSET_MS)
    if (local.getUTCDate() !== 1 || local.getUTCHours() < 10) return
    runGuardianReports({ dryRun: false }).then((r) => { if (r.eligible) console.log('[Guardian] resumo mensal', JSON.stringify(r)) })
      .catch((error) => console.warn('[Guardian] falha no resumo mensal', (error as Error).message))
  }
  const timer = setInterval(tick, 60 * 60_000)
  timer.unref()
  tick()
  return timer
}

export const guardianRouter = Router()
guardianRouter.get('/', requireAuth, getGuardian)
guardianRouter.put('/', requireAuth, setGuardian)
guardianRouter.delete('/', requireAuth, removeGuardian)
guardianRouter.post('/confirm', confirmGuardian)
guardianRouter.post('/unsubscribe', unsubscribeGuardian)
