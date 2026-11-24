import crypto from 'node:crypto'
import { prisma } from '../../lib/prisma'
import { env } from '../../lib/env'
import { sendMail } from '../../lib/mailer'
import { trailService } from '../trail/trail.service'

export const WEEKLY_KIND = 'weekly-next-step'

/** Semana ISO no horário de Brasília, ex.: 2026-W48. */
export function weekKey(now = new Date()): string {
  const local = new Date(now.getTime() - 3 * 3600_000)
  const day = (local.getUTCDay() + 6) % 7
  const thursday = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - day + 3))
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4))
  const week = 1 + Math.round(((thursday.getTime() - firstThursday.getTime()) / 86_400_000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7)
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

const sign = (value: string) => crypto.createHmac('sha256', env.JWT_SECRET).update(`unsubscribe:${value}`).digest('base64url')

export function unsubscribeToken(userId: string): string {
  return `${Buffer.from(userId).toString('base64url')}.${sign(userId)}`
}

export function verifyUnsubscribeToken(token: string): string | null {
  const [encoded, mac] = token.split('.')
  if (!encoded || !mac) return null
  const userId = Buffer.from(encoded, 'base64url').toString('utf8')
  const expected = Buffer.from(sign(userId))
  const given = Buffer.from(mac)
  return expected.length === given.length && crypto.timingSafeEqual(expected, given) ? userId : null
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

export function buildWeeklyEmail(input: {
  firstName: string; examName: string; topicName: string | null; subjectName: string | null
  answeredLastWeek: number; appUrl: string; unsubscribeUrl: string
}) {
  const next = input.topicName && input.subjectName ? `${input.topicName} (${input.subjectName})` : null
  const subject = next ? `Seu próximo passo no Kuaa: ${input.topicName}` : 'Seu próximo passo no Kuaa'
  const activity = input.answeredLastWeek > 0
    ? `Na última semana você respondeu ${input.answeredLastWeek} ${input.answeredLastWeek === 1 ? 'questão' : 'questões'}.`
    : 'Você não estudou no Kuaa na última semana. Dez minutos hoje já colocam a trilha em movimento.'
  const lines = [
    `Oi, ${input.firstName}!`, '', activity, '',
    next ? `Pela sua trilha do ${input.examName}, o próximo tópico é ${next}.` : `Abra sua trilha do ${input.examName} para ver o próximo tópico.`,
    '', `Continuar: ${input.appUrl}/dashboard`, '', '—', 'Kuaa',
    `Não quer mais receber este e-mail semanal? ${input.unsubscribeUrl}`,
  ]
  const html = `<div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5;color:#1E1424;max-width:520px">
<p>Oi, ${escapeHtml(input.firstName)}!</p>
<p>${escapeHtml(activity)}</p>
<p>${next ? `Pela sua trilha do ${escapeHtml(input.examName)}, o próximo tópico é <strong>${escapeHtml(next)}</strong>.` : `Abra sua trilha do ${escapeHtml(input.examName)} para ver o próximo tópico.`}</p>
<p><a href="${input.appUrl}/dashboard" style="display:inline-block;background:#FFDC5C;color:#35143E;font-weight:bold;padding:12px 22px;border-radius:999px;text-decoration:none">Continuar estudando</a></p>
<p style="font-size:13px;color:#5C5160">Kuaa · <a href="${input.unsubscribeUrl}" style="color:#5C5160">Não quero mais receber este e-mail semanal</a></p>
</div>`
  return { subject, text: lines.join('\n'), html }
}

export interface WeeklyRunResult { eligible: number; sent: number; skippedAlreadySent: number; failed: number }

/**
 * Envia o e-mail semanal para quem tem matrícula, não desativou o e-mail e
 * se cadastrou há pelo menos 3 dias. Idempotente por semana (EmailLog).
 * dryRun conta sem enviar nem gravar.
 */
export async function runWeeklyEmails(options: { dryRun: boolean; now?: Date; limit?: number }): Promise<WeeklyRunResult> {
  const now = options.now ?? new Date()
  const period = weekKey(now)
  const appUrl = (env.APP_URL ?? 'http://localhost:5173').replace(/\/$/, '')
  const users = await prisma.user.findMany({
    where: { createdAt: { lte: new Date(now.getTime() - 3 * 86_400_000) }, enrollments: { some: {} } },
    select: { id: true, email: true, name: true, preferences: true, activeVestibularId: true,
      enrollments: { select: { vestibularId: true, vestibular: { select: { slug: true, name: true } } } },
      emailLogs: { where: { kind: WEEKLY_KIND, periodKey: period }, select: { id: true } } },
    orderBy: { createdAt: 'asc' },
    take: options.limit ?? 5000,
  })
  const result: WeeklyRunResult = { eligible: 0, sent: 0, skippedAlreadySent: 0, failed: 0 }
  for (const user of users) {
    const prefs = user.preferences as { weeklyEmail?: boolean } | null
    if (prefs?.weeklyEmail === false) continue
    if (user.emailLogs.length) { result.skippedAlreadySent++; continue }
    result.eligible++
    if (options.dryRun) continue
    try {
      const enrollment = user.enrollments.find((item) => item.vestibularId === user.activeVestibularId) ?? user.enrollments[0]
      const next = await trailService.getNextTopic(user.id, enrollment.vestibular.slug)
      const answeredLastWeek = await prisma.userAnswer.count({ where: { userId: user.id, answeredAt: { gte: new Date(now.getTime() - 7 * 86_400_000) } } })
      const mail = buildWeeklyEmail({
        firstName: user.name.trim().split(/\s+/)[0] || 'estudante', examName: enrollment.vestibular.name,
        topicName: next.topic?.name ?? null, subjectName: next.subject?.name ?? null, answeredLastWeek,
        appUrl, unsubscribeUrl: `${appUrl}/descadastrar#token=${unsubscribeToken(user.id)}`,
      })
      // Reserva a semana antes de enviar: duas execuções simultâneas não duplicam.
      await prisma.emailLog.create({ data: { userId: user.id, kind: WEEKLY_KIND, periodKey: period } })
      const delivered = await sendMail({ to: user.email, ...mail })
      if (delivered) result.sent++
      else {
        result.failed++
        await prisma.emailLog.deleteMany({ where: { userId: user.id, kind: WEEKLY_KIND, periodKey: period } })
      }
    } catch {
      result.failed++
    }
  }
  return result
}
