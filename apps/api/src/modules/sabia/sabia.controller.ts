import type { Request, Response, NextFunction } from 'express'
import { makeError } from '../../utils/errors'
import { prisma } from '../../lib/prisma'
import { askSabia, type ChatMessage } from './sabia.service'

const select = { id: true, role: true, content: true, createdAt: true }

async function ensureLegacyConversation(userId: string) {
  const first = await prisma.sabiaMessage.findFirst({
    where: { userId, conversationId: null }, orderBy: { createdAt: 'asc' }, select: { createdAt: true },
  })
  if (!first) return
  const id = `legacy_${userId}`
  await prisma.$transaction(async (tx) => {
    await tx.sabiaConversation.upsert({
      where: { id }, update: {},
      create: { id, userId, title: 'Conversa anterior', createdAt: first.createdAt },
    })
    await tx.sabiaMessage.updateMany({ where: { userId, conversationId: null }, data: { conversationId: id } })
  })
}

async function ownConversation(userId: string, id: unknown) {
  if (typeof id !== 'string' || !id.trim()) throw makeError('Conversa inválida.', 400, 'INVALID_INPUT')
  const conversation = await prisma.sabiaConversation.findFirst({ where: { id, userId } })
  if (!conversation) throw makeError('Conversa não encontrada.', 404, 'NOT_FOUND')
  return conversation
}

export async function conversations(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await ensureLegacyConversation(req.userId!)
    const items = await prisma.sabiaConversation.findMany({
      where: { userId: req.userId! },
      orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      select: { id: true, title: true, createdAt: true, updatedAt: true, _count: { select: { messages: true } } },
    })
    res.set('Cache-Control', 'no-store').json({ conversations: items })
  } catch (err) { next(err) }
}

export async function history(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await ensureLegacyConversation(req.userId!)
    const conversationId = req.query.conversationId === undefined ? undefined
      : (await ownConversation(req.userId!, req.query.conversationId)).id
    const messages = await prisma.sabiaMessage.findMany({
      where: { userId: req.userId!, conversationId }, select,
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    })
    res.set('Cache-Control', 'no-store').json({ messages })
  } catch (err) { next(err) }
}

export async function ask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const message: unknown = req.body?.message
    if (typeof message !== 'string' || !message.trim()) {
      throw makeError('O campo message é obrigatório.', 400, 'INVALID_INPUT')
    }
    if (message.length > 2000) {
      throw makeError('Mensagem muito longa (máximo 2000 caracteres).', 400, 'MESSAGE_TOO_LONG')
    }
    const userId = req.userId!
    await ensureLegacyConversation(userId)
    const conversation = req.body.conversationId === null ? null
      : req.body.conversationId === undefined
      ? await prisma.sabiaConversation.findFirst({ where: { userId }, orderBy: { updatedAt: 'desc' } })
      : await ownConversation(userId, req.body.conversationId)
    const recent = await prisma.sabiaMessage.findMany({
      where: { userId, conversationId: conversation?.id ?? null }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 20,
    })
    const context: ChatMessage[] = (req.body.conversationId === null ? [] : recent).reverse().flatMap((entry) =>
      entry.role === 'user' || entry.role === 'assistant'
        ? [{ role: entry.role, content: entry.content }] : [],
    )
    const reply = await askSabia(message.trim(), context)
    const saved = await prisma.$transaction(async (tx) => {
      const thread = conversation
        ? await tx.sabiaConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } })
        : await tx.sabiaConversation.create({ data: { userId, title: message.trim().replace(/\s+/g, ' ').slice(0, 80) } })
      const latest = await tx.sabiaMessage.findFirst({
        where: { userId, conversationId: thread.id }, orderBy: { createdAt: 'desc' }, select: { createdAt: true },
      })
      const createdAt = new Date(Math.max(Date.now(), (latest?.createdAt.getTime() ?? 0) + 1))
      const question = await tx.sabiaMessage.create({
        data: { userId, conversationId: thread.id, role: 'user', content: message.trim(), createdAt }, select,
      })
      const answer = await tx.sabiaMessage.create({
        data: { userId, conversationId: thread.id, role: 'assistant', content: reply,
          createdAt: new Date(Math.max(Date.now(), question.createdAt.getTime() + 1)) }, select,
      })
      return { conversationId: thread.id, messages: [question, answer] }
    })
    res.set('Cache-Control', 'no-store').json({ reply, ...saved })
  } catch (err) { next(err) }
}
