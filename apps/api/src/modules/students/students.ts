import express, { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { env } from '../../lib/env'
import { prisma } from '../../lib/prisma'
import { requireAuth } from '../../middleware/requireAuth'
import { makeError } from '../../utils/errors'

/*
 * Meia para estudante: o aluno envia uma foto da carteirinha ou da declaração
 * de matrícula; um administrador aprova ou recusa. Dados mínimos:
 *  - a imagem é APAGADA no momento da análise (fica só o resultado);
 *  - pedidos sem análise há mais de 30 dias têm a imagem apagada;
 *  - a aprovação vale 12 meses; depois o aluno envia de novo.
 */
const MAX_BYTES = 4 * 1024 * 1024
const VALID_MS = 365 * 24 * 3600 * 1000
const PURGE_MS = 30 * 24 * 3600 * 1000

function sniffMime(buf: Buffer): string | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (buf.length > 12 && buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'image/webp'
  if (buf.length > 5 && buf.subarray(0, 5).toString() === '%PDF-') return 'application/pdf'
  return null
}

export async function isStudentEligible(userId: string, now = new Date()): Promise<boolean> {
  const approved = await prisma.studentVerification.findFirst({ where: { userId, status: 'APPROVED', expiresAt: { gt: now } }, select: { id: true } })
  return Boolean(approved)
}

async function purgeStale(now = new Date()) {
  await prisma.studentVerification.updateMany({
    where: { status: 'PENDING', submittedAt: { lt: new Date(now.getTime() - PURGE_MS) } },
    data: { status: 'EXPIRED', documentData: null, documentMime: null },
  })
}

function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  const admins = new Set(env.ADMIN_USER_IDS.split(',').map((id) => id.trim()).filter(Boolean))
  if (!req.userId || !admins.has(req.userId)) { next(makeError('Acesso restrito.', 403, 'FORBIDDEN')); return }
  next()
}

export const studentsRouter = Router()

/** Envio do documento. Montado com limite de corpo maior (ver app.ts). */
export const studentUploadHandlers = [
  express.json({ limit: '6mb' }),
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { fileBase64 } = z.object({ fileBase64: z.string().min(100).max(6_000_000), consent: z.literal(true) }).strict().parse(req.body)
      const data = Buffer.from(fileBase64.replace(/^data:[^;]+;base64,/, ''), 'base64')
      if (data.length > MAX_BYTES) throw makeError('Arquivo maior que 4 MB.', 413, 'FILE_TOO_LARGE')
      const mime = sniffMime(data)
      if (!mime) throw makeError('Envie uma foto (JPG, PNG ou WEBP) ou um PDF.', 400, 'INVALID_FILE')
      const userId = req.userId!
      if (await isStudentEligible(userId)) throw makeError('Sua meia já está aprovada.', 409, 'ALREADY_APPROVED')
      const recent = await prisma.studentVerification.count({ where: { userId, submittedAt: { gt: new Date(Date.now() - 24 * 3600 * 1000) } } })
      if (recent >= 3) throw makeError('Muitos envios hoje. Tente amanhã.', 429, 'RATE_LIMIT_EXCEEDED')
      // Um pedido pendente por aluno: o novo substitui o anterior (e apaga a imagem antiga).
      await prisma.studentVerification.updateMany({ where: { userId, status: 'PENDING' }, data: { status: 'REPLACED', documentData: null, documentMime: null } })
      await prisma.studentVerification.create({ data: { userId, status: 'PENDING', documentData: data, documentMime: mime } })
      res.status(201).json({ status: 'PENDING' })
    } catch (err) { next(err) }
  },
]

studentsRouter.get('/verification', requireAuth, async (req, res, next) => {
  try {
    const last = await prisma.studentVerification.findFirst({ where: { userId: req.userId!, status: { not: 'REPLACED' } }, orderBy: { submittedAt: 'desc' },
      select: { status: true, submittedAt: true, reviewedAt: true, expiresAt: true, rejectReason: true } })
    const eligible = await isStudentEligible(req.userId!)
    res.json({ eligible, last })
  } catch (err) { next(err) }
})

export const adminStudentsRouter = Router()
adminStudentsRouter.use(requireAuth, requireAdmin)

adminStudentsRouter.get('/', async (_req, res, next) => {
  try {
    await purgeStale()
    const pending = await prisma.studentVerification.findMany({
      where: { status: 'PENDING' }, orderBy: { submittedAt: 'asc' }, take: 100,
      select: { id: true, submittedAt: true, documentMime: true, user: { select: { name: true, email: true } } },
    })
    res.json(pending)
  } catch (err) { next(err) }
})

adminStudentsRouter.get('/:id/document', async (req, res, next) => {
  try {
    const item = await prisma.studentVerification.findUnique({ where: { id: String(req.params.id) }, select: { documentData: true, documentMime: true } })
    if (!item?.documentData || !item.documentMime) throw makeError('Documento não disponível.', 404, 'NOT_FOUND')
    res.setHeader('Content-Type', item.documentMime)
    res.setHeader('Content-Disposition', 'inline')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.send(Buffer.from(item.documentData))
  } catch (err) { next(err) }
})

adminStudentsRouter.post('/:id/review', async (req, res, next) => {
  try {
    const { approve, reason } = z.object({ approve: z.boolean(), reason: z.string().max(200).optional() }).strict().parse(req.body)
    const now = new Date()
    const updated = await prisma.studentVerification.updateMany({
      where: { id: String(req.params.id), status: 'PENDING' },
      data: approve
        ? { status: 'APPROVED', reviewedAt: now, expiresAt: new Date(now.getTime() + VALID_MS), documentData: null, documentMime: null }
        : { status: 'REJECTED', reviewedAt: now, rejectReason: reason ?? 'Documento não comprova matrícula atual.', documentData: null, documentMime: null },
    })
    if (updated.count !== 1) throw makeError('Pedido não está pendente.', 409, 'NOT_PENDING')
    res.json({ ok: true })
  } catch (err) { next(err) }
})
