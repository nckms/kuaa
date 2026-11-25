// Convite entre alunos: quem convida e quem chega ganham 7 dias de Plus quando
// o convidado TERMINA o diagnóstico (cadastro sozinho não conta). Limite de
// 5 recompensas por 30 dias para quem convida, para conter contas falsas.
import crypto from 'node:crypto'
import type { Request, Response, NextFunction } from 'express'
import { env } from '../../lib/env'
import { prisma } from '../../lib/prisma'
import { recomputePlan } from '../plans/coverage'

export const REFERRAL_DAYS = 7
export const REFERRAL_LIMIT_30D = 5
const SOURCE = 'referral'
const DAY = 86_400_000

function newCode(): string {
  // 8 caracteres sem ambiguidade (sem 0/o/1/l).
  const alphabet = 'abcdefghijkmnpqrstuvwxyz23456789'
  return Array.from(crypto.randomBytes(8), (b) => alphabet[b % alphabet.length]).join('')
}

export async function referralCodeFor(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { referralCode: true } })
  if (user.referralCode) return user.referralCode
  for (let attempt = 0; attempt < 5; attempt++) {
    // updateMany com referralCode: null evita sobrescrever um código criado em paralelo;
    // colisão de código (único) só faz tentar de novo.
    await prisma.user.updateMany({ where: { id: userId, referralCode: null }, data: { referralCode: newCode() } }).catch(() => undefined)
    const again = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { referralCode: true } })
    if (again.referralCode) return again.referralCode
  }
  throw new Error('Não foi possível gerar o código de convite')
}

/** Resolve o código de convite no cadastro. Código inválido é ignorado. */
export async function inviterFromCode(code: string | undefined): Promise<string | null> {
  if (!code || !/^[a-z0-9]{6,12}$/.test(code)) return null
  const inviter = await prisma.user.findUnique({ where: { referralCode: code }, select: { id: true } })
  return inviter?.id ?? null
}

async function grantDays(userId: string, reference: string, now: Date) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { planExpiresAt: true, plan: true } })
  const base = user.plan === 'PLUS' && user.planExpiresAt && user.planExpiresAt > now ? user.planExpiresAt : now
  await prisma.planGrant.create({ data: { userId, plan: 'PLUS', source: SOURCE, reference, expiresAt: new Date(base.getTime() + REFERRAL_DAYS * DAY) } })
  await recomputePlan(userId, now)
}

/** Chamado quando um aluno conclui o diagnóstico. Idempotente. */
export async function rewardReferral(inviteeId: string, now = new Date()): Promise<{ invitee: boolean; inviter: boolean }> {
  const invitee = await prisma.user.findUnique({ where: { id: inviteeId }, select: { referredById: true } })
  if (!invitee?.referredById) return { invitee: false, inviter: false }
  const inviterId = invitee.referredById
  let gaveInvitee = false
  let gaveInviter = false
  try { await grantDays(inviteeId, `invitee:${inviteeId}`, now); gaveInvitee = true } catch { /* já recompensado */ }
  if (gaveInvitee) {
    const recent = await prisma.planGrant.count({ where: { userId: inviterId, source: SOURCE, reference: { startsWith: 'inviter:' }, createdAt: { gte: new Date(now.getTime() - 30 * DAY) } } })
    if (recent < REFERRAL_LIMIT_30D) {
      try { await grantDays(inviterId, `inviter:${inviteeId}`, now); gaveInviter = true } catch { /* já recompensado */ }
    }
  }
  return { invitee: gaveInvitee, inviter: gaveInviter }
}

export async function myReferral(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!
    const code = await referralCodeFor(userId)
    const appUrl = (env.APP_URL ?? 'https://kuaa-web.vercel.app').replace(/\/$/, '')
    const [joined, rewarded, recent] = await Promise.all([
      prisma.user.count({ where: { referredById: userId } }),
      prisma.planGrant.count({ where: { userId, source: SOURCE, reference: { startsWith: 'inviter:' } } }),
      prisma.planGrant.count({ where: { userId, source: SOURCE, reference: { startsWith: 'inviter:' }, createdAt: { gte: new Date(Date.now() - 30 * DAY) } } }),
    ])
    res.json({ code, url: `${appUrl}/?convite=${code}`, joined, rewarded, rewardDays: REFERRAL_DAYS, remainingThisMonth: Math.max(0, REFERRAL_LIMIT_30D - recent) })
  } catch (err) { next(err) }
}
