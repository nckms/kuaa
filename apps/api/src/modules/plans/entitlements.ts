import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { recordQuotaHit } from './signals'
import { prisma } from '../../lib/prisma'

export type PlanName = 'FREE' | 'PLUS'
export type QuotaName = 'practice' | 'sabia' | 'essayFeedback'

/**
 * Limites por plano. O gratuito mantém o valor central (diagnóstico, trilha,
 * explicação de todo erro, simulado semanal); o Plus amplia volume.
 * Explicações e correções nunca têm cota.
 */
export const PLAN_LIMITS: Record<PlanName, Record<QuotaName, number>> = {
  FREE: { practice: 5, sabia: 15, essayFeedback: 2 },
  PLUS: { practice: 40, sabia: 100, essayFeedback: 15 },
}
export const QUOTA_PERIOD: Record<QuotaName, 'day' | 'month'> = { practice: 'day', sabia: 'day', essayFeedback: 'month' }

const BRT_OFFSET_MS = 3 * 60 * 60 * 1000 // America/Sao_Paulo, sem horário de verão desde 2019

/** Início do dia/mês no horário de Brasília, em UTC. */
export function periodStart(period: 'day' | 'month', now = new Date()): Date {
  const local = new Date(now.getTime() - BRT_OFFSET_MS)
  const start = period === 'day'
    ? Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate())
    : Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), 1)
  return new Date(start + BRT_OFFSET_MS)
}

export function effectivePlan(user: { plan: string; planExpiresAt: Date | null }, now = new Date()): PlanName {
  return user.plan === 'PLUS' && (!user.planExpiresAt || user.planExpiresAt > now) ? 'PLUS' : 'FREE'
}

export async function usage(userId: string, quota: QuotaName, now = new Date()): Promise<number> {
  const since = periodStart(QUOTA_PERIOD[quota], now)
  if (quota === 'practice') return prisma.quizSession.count({ where: { userId, startedAt: { gte: since } } })
  if (quota === 'sabia') return prisma.sabiaMessage.count({ where: { userId, role: 'user', createdAt: { gte: since } } })
  // Conta análises entregues ou em andamento; falhas da IA não consomem cota.
  const rows = await prisma.$queryRaw<Array<{ n: number }>>`
    SELECT count(*)::int AS n FROM "EssayDraft"
    WHERE "userId" = ${userId} AND "aiConsentAt" >= ${since}
      AND ("feedback" IS NOT NULL OR "feedbackRequestedAt" IS NOT NULL)`
  return rows[0]?.n ?? 0
}

export async function planSummary(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { plan: true, planExpiresAt: true } })
  const plan = effectivePlan(user)
  const quotas = await Promise.all((Object.keys(PLAN_LIMITS.FREE) as QuotaName[]).map(async (name) => ({
    name, period: QUOTA_PERIOD[name], limit: PLAN_LIMITS[plan][name], used: await usage(userId, name),
  })))
  return { plan, expiresAt: plan === 'PLUS' ? user.planExpiresAt : null, quotas }
}

const MESSAGES: Record<QuotaName, (limit: number, plan: PlanName) => string> = {
  practice: (limit, plan) => `Você já fez as ${limit} práticas de hoje${plan === 'FREE' ? ' do plano gratuito' : ''}. Amanhã libera de novo.`,
  sabia: (limit, plan) => `Você já enviou as ${limit} perguntas de hoje ao Sabiá${plan === 'FREE' ? ' no plano gratuito' : ''}. Amanhã libera de novo.`,
  essayFeedback: (limit, plan) => `Você já usou as ${limit} análises de redação deste mês${plan === 'FREE' ? ' do plano gratuito' : ''}.`,
}

/** Bloqueia com 429 QUOTA_EXCEEDED quando a cota do período acabou. */
export function requireQuota(quota: QuotaName): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { plan: true, planExpiresAt: true } })
      if (!user) { next(); return }
      const plan = effectivePlan(user)
      const limit = PLAN_LIMITS[plan][quota]
      if (await usage(req.userId!, quota) >= limit) {
        if (plan === 'FREE') await recordQuotaHit(req.userId!, quota)
        res.status(429).json({ error: MESSAGES[quota](limit, plan), code: 'QUOTA_EXCEEDED', quota, plan, limit,
          upgrade: plan === 'FREE' ? '/planos' : undefined })
        return
      }
      next()
    } catch (err) { next(err) }
  }
}
