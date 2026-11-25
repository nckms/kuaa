// Lembretes de estudo por notificação (Web Push). O aluno ativa no app; uma vez
// por dia, às 19h de Brasília, quem ainda não estudou naquele dia recebe um
// lembrete com o próximo tópico. Nada é enviado sem inscrição explícita.
import type { Request, Response, NextFunction } from 'express'
import webpush from 'web-push'
import { z } from 'zod'
import { env } from '../../lib/env'
import { prisma } from '../../lib/prisma'
import { makeError } from '../../utils/errors'
import { trailService } from '../trail/trail.service'

export const PUSH_KIND = 'push-daily-reminder'
export const REMINDER_HOUR_BRT = 19
/** Depois disso sem estudar, para de lembrar (evita insistir com quem desistiu). */
export const STOP_AFTER_INACTIVE_DAYS = 21

export interface PushPayload { title: string; body: string; url: string; tag: string }
type Sender = (sub: { endpoint: string; p256dh: string; auth: string }, payload: PushPayload) => Promise<void>

export function pushEnabled(): boolean { return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY) }

let sender: Sender = async (sub, payload) => {
  await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload), {
    vapidDetails: { subject: env.VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC_KEY!, privateKey: env.VAPID_PRIVATE_KEY! },
    TTL: 6 * 3600, urgency: 'normal',
  })
}
/** Permite trocar o envio nos testes. */
export function setPushSender(fn: Sender) { sender = fn }

/** Dia (AAAA-MM-DD) e início do dia no horário de Brasília (UTC−3, sem horário de verão). */
export function brtDay(now = new Date()): { key: string; start: Date; hour: number } {
  const local = new Date(now.getTime() - 3 * 3600_000)
  const key = local.toISOString().slice(0, 10)
  return { key, start: new Date(`${key}T03:00:00.000Z`), hour: local.getUTCHours() }
}

// ── Rotas ────────────────────────────────────────────────────────────────
export function pushConfig(_req: Request, res: Response) {
  res.json({ enabled: pushEnabled(), publicKey: pushEnabled() ? env.VAPID_PUBLIC_KEY : null, hourBrt: REMINDER_HOUR_BRT })
}

const SubscribeSchema = z.object({
  endpoint: z.string().url().max(1000).refine((url) => url.startsWith('https://'), 'endpoint inválido'),
  keys: z.object({ p256dh: z.string().min(20).max(200), auth: z.string().min(8).max(100) }),
})

export async function subscribePush(req: Request, res: Response, next: NextFunction) {
  try {
    if (!pushEnabled()) throw makeError('Lembretes indisponíveis no momento.', 503, 'PUSH_UNAVAILABLE')
    const parsed = SubscribeSchema.safeParse(req.body)
    if (!parsed.success) throw makeError('Inscrição de notificação inválida.', 400, 'INVALID_SUBSCRIPTION')
    const { endpoint, keys } = parsed.data
    const userId = req.userId!
    // O mesmo navegador pode trocar de conta: o endpoint passa a ser do usuário atual.
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { userId, p256dh: keys.p256dh, auth: keys.auth },
      create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
    })
    if (await prisma.pushSubscription.count({ where: { userId } }) > 5) {
      const old = await prisma.pushSubscription.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, skip: 5, select: { id: true } })
      await prisma.pushSubscription.deleteMany({ where: { id: { in: old.map((o) => o.id) } } })
    }
    res.status(201).json({ subscribed: true })
  } catch (err) { next(err) }
}

export async function unsubscribePush(req: Request, res: Response, next: NextFunction) {
  try {
    const endpoint = z.object({ endpoint: z.string().max(1000) }).safeParse(req.body)
    const where = endpoint.success ? { userId: req.userId!, endpoint: endpoint.data.endpoint } : { userId: req.userId! }
    await prisma.pushSubscription.deleteMany({ where })
    res.status(204).end()
  } catch (err) { next(err) }
}

export async function pushStatus(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ enabled: pushEnabled(), devices: await prisma.pushSubscription.count({ where: { userId: req.userId! } }) })
  } catch (err) { next(err) }
}

// ── Lembrete diário ──────────────────────────────────────────────────────
export function buildReminder(input: { firstName: string; streakDays: number; topicName: string | null }): PushPayload {
  const next = input.topicName ? `Próximo: ${input.topicName}. ` : ''
  if (input.streakDays >= 2) {
    return { title: `Sua sequência de ${input.streakDays} dias está em jogo`, body: `${next}Uns 5 minutos garantem o dia.`, url: '/dashboard?origem=lembrete', tag: PUSH_KIND }
  }
  return { title: `${input.firstName}, 5 minutos de estudo hoje?`, body: `${next}Sua trilha está esperando.`, url: '/dashboard?origem=lembrete', tag: PUSH_KIND }
}

export interface ReminderRunResult { eligible: number; sent: number; skippedStudiedToday: number; skippedAlreadySent: number; removedExpired: number; failed: number }

export async function runDailyReminders(options: { now?: Date; force?: boolean } = {}): Promise<ReminderRunResult> {
  const now = options.now ?? new Date()
  const day = brtDay(now)
  const result: ReminderRunResult = { eligible: 0, sent: 0, skippedStudiedToday: 0, skippedAlreadySent: 0, removedExpired: 0, failed: 0 }
  if (!pushEnabled() || (!options.force && day.hour !== REMINDER_HOUR_BRT)) return result

  const users = await prisma.user.findMany({
    where: { pushSubscriptions: { some: {} }, enrollments: { some: {} } },
    select: { id: true, name: true, streakDays: true, lastActivityAt: true, createdAt: true, preferences: true, activeVestibularId: true,
      enrollments: { select: { vestibularId: true, vestibular: { select: { slug: true } } } },
      pushSubscriptions: { select: { id: true, endpoint: true, p256dh: true, auth: true } },
      emailLogs: { where: { kind: PUSH_KIND, periodKey: day.key }, select: { id: true } } },
    take: 5000,
  })
  for (const user of users) {
    if ((user.preferences as { pushReminders?: boolean } | null)?.pushReminders === false) continue
    if (user.emailLogs.length) { result.skippedAlreadySent++; continue }
    const lastSeen = user.lastActivityAt ?? user.createdAt
    if (now.getTime() - lastSeen.getTime() > STOP_AFTER_INACTIVE_DAYS * 86_400_000) continue
    const studiedToday = (user.lastActivityAt && user.lastActivityAt >= day.start)
      || await prisma.userAnswer.count({ where: { userId: user.id, answeredAt: { gte: day.start } } }) > 0
    if (studiedToday) { result.skippedStudiedToday++; continue }
    result.eligible++
    try {
      // Reserva o dia antes de enviar: duas instâncias da API não duplicam o lembrete.
      await prisma.emailLog.create({ data: { userId: user.id, kind: PUSH_KIND, periodKey: day.key } })
    } catch { result.skippedAlreadySent++; continue }
    let topicName: string | null = null
    try {
      const enrollment = user.enrollments.find((e) => e.vestibularId === user.activeVestibularId) ?? user.enrollments[0]
      topicName = (await trailService.getNextTopic(user.id, enrollment.vestibular.slug)).topic?.name ?? null
    } catch { /* lembrete sai sem o nome do tópico */ }
    const payload = buildReminder({ firstName: user.name.trim().split(/\s+/)[0] || 'Oi', streakDays: user.streakDays, topicName })
    let delivered = false
    for (const sub of user.pushSubscriptions) {
      try {
        await sender(sub, payload)
        delivered = true
        await prisma.pushSubscription.update({ where: { id: sub.id }, data: { lastSentAt: now } })
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => undefined)
          result.removedExpired++
        }
      }
    }
    if (delivered) result.sent++
    else result.failed++
  }
  return result
}

/** Confere a cada 10 minutos; só envia na hora do lembrete e uma vez por dia (idempotente no banco). */
export function startReminderScheduler(): NodeJS.Timeout | null {
  if (!pushEnabled() || env.NODE_ENV === 'test') return null
  const tick = () => {
    if (brtDay().hour !== REMINDER_HOUR_BRT) return
    runDailyReminders().then((r) => { if (r.eligible || r.removedExpired) console.log('[Push] lembretes', JSON.stringify(r)) })
      .catch((error) => console.warn('[Push] falha no lembrete diário', (error as Error).message))
  }
  const timer = setInterval(tick, 10 * 60_000)
  timer.unref()
  tick()
  return timer
}
