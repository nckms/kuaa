// Sinais de intenção de compra, idempotentes por usuário/tipo/período.
import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { brtDay } from '../engagement/push'

export const INTEREST_KIND = 'plus-interest'

export async function recordSignal(userId: string, kind: string, periodKey: string, source?: string): Promise<boolean> {
  try {
    await prisma.productSignal.create({ data: { userId, kind, periodKey, source } })
    return true
  } catch { return false } // já registrado neste período
}

/** Cota do gratuito atingida: 1 registro por cota por dia (horário de Brasília). */
export async function recordQuotaHit(userId: string, quota: string): Promise<void> {
  await recordSignal(userId, `quota-hit:${quota}`, brtDay().key)
}

const InterestSchema = z.object({ source: z.enum(['planos', 'cota-practice', 'cota-sabia', 'cota-essayFeedback', 'cota', 'outro']).default('outro') })

export async function registerInterest(req: Request, res: Response, next: NextFunction) {
  try {
    const { source } = InterestSchema.catch({ source: 'outro' }).parse(req.body ?? {})
    await recordSignal(req.userId!, INTEREST_KIND, 'once', source)
    res.status(201).json({ registered: true })
  } catch (err) { next(err) }
}

export async function myInterest(req: Request, res: Response, next: NextFunction) {
  try {
    const found = await prisma.productSignal.findUnique({ where: { userId_kind_periodKey: { userId: req.userId!, kind: INTEREST_KIND, periodKey: 'once' } } })
    res.json({ registered: Boolean(found) })
  } catch (err) { next(err) }
}
