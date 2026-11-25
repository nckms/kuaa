import { prisma } from '../../lib/prisma'

/** Status de assinatura da Stripe que mantêm o Plus liberado. */
export const COVERING_STATUSES = new Set(['active', 'trialing', 'past_due'])
/**
 * Folga após o fim do período: no Pix Automático o débito da renovação só
 * acontece 3 dias depois do aviso do banco e pode levar até 7 dias com novas
 * tentativas. Sem folga, o aluno perderia o Plus enquanto a renovação corre.
 */
export const RENEWAL_GRACE_MS = 8 * 24 * 3600 * 1000

/**
 * Recalcula plan/planExpiresAt a partir de todas as fontes: assinaturas e
 * liberações manuais (grant-plus) não revogadas. Idempotente.
 */
export async function recomputePlan(userId: string, now = new Date()): Promise<void> {
  const [subs, grants] = await Promise.all([
    prisma.subscription.findMany({ where: { userId } }),
    prisma.planGrant.findMany({ where: { userId } }),
  ])
  let coverage: Date | null = null
  const extend = (d: Date | null) => { if (d && (!coverage || d > coverage)) coverage = d }
  for (const sub of subs) {
    if (COVERING_STATUSES.has(sub.status) && sub.currentPeriodEnd) extend(new Date(sub.currentPeriodEnd.getTime() + RENEWAL_GRACE_MS))
  }
  const revoked = new Set(grants.filter((g) => g.plan === 'FREE').map((g) => g.reference))
  for (const grant of grants) {
    if (grant.plan === 'PLUS' && !revoked.has(grant.reference)) extend(grant.expiresAt)
  }
  const active = coverage !== null && (coverage as Date) > now
  await prisma.user.update({ where: { id: userId }, data: { plan: active ? 'PLUS' : 'FREE', planExpiresAt: active ? coverage : null } })
}
