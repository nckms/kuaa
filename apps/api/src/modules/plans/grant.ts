import { prisma } from '../../lib/prisma'

/** Fim do dia no horário de Brasília para uma data AAAA-MM-DD. */
export const endOfDayBrt = (date: string) => new Date(`${date}T23:59:59-03:00`)

/**
 * Libera o Plus de forma idempotente: o mesmo (source, reference) nunca libera
 * duas vezes, e uma validade maior já existente nunca é reduzida.
 * Retorna false quando a referência já tinha sido usada.
 */
export async function grantPlus(userId: string, expiresAt: Date, source: string, reference: string): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const used = await tx.planGrant.findUnique({ where: { source_reference: { source, reference } } })
    if (used) return false
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { plan: true, planExpiresAt: true } })
    const keep = user.plan === 'PLUS' && (!user.planExpiresAt || user.planExpiresAt > expiresAt)
    const finalExpiry = keep ? user.planExpiresAt : expiresAt
    await tx.planGrant.create({ data: { userId, plan: 'PLUS', expiresAt: finalExpiry ?? expiresAt, source, reference } })
    await tx.user.update({ where: { id: userId }, data: { plan: 'PLUS', planExpiresAt: finalExpiry } })
    return true
  }).catch((error: unknown) => {
    // Duas entregas simultâneas do mesmo evento: a segunda bate na chave única.
    if (typeof error === 'object' && error && 'code' in error && (error as { code: string }).code === 'P2002') return false
    throw error
  })
}

/** Revoga o Plus liberado por uma referência (ex.: reembolso total). Idempotente. */
export async function revokeGrant(source: string, reference: string, revokeSource: string): Promise<boolean> {
  const grant = await prisma.planGrant.findUnique({ where: { source_reference: { source, reference } } })
  if (!grant) return false
  return prisma.$transaction(async (tx) => {
    const already = await tx.planGrant.findUnique({ where: { source_reference: { source: revokeSource, reference } } })
    if (already) return false
    const now = new Date()
    await tx.planGrant.create({ data: { userId: grant.userId, plan: 'FREE', expiresAt: now, source: revokeSource, reference } })
    // Só derruba o plano se nenhuma outra liberação válida cobre o aluno.
    const other = await tx.planGrant.findFirst({ where: { userId: grant.userId, plan: 'PLUS', id: { not: grant.id }, expiresAt: { gt: now },
      NOT: { reference: { in: (await tx.planGrant.findMany({ where: { userId: grant.userId, plan: 'FREE' }, select: { reference: true } })).map((r) => r.reference ?? '') } } } })
    if (!other) await tx.user.update({ where: { id: grant.userId }, data: { plan: 'FREE', planExpiresAt: null } })
    return true
  })
}
