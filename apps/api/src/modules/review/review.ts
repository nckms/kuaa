// Caderno de erros com revisão espaçada (gratuito).
// Toda questão errada (prática, revisão ou prova anterior) entra no caderno e volta 1 dia depois.
// Acertou na revisão: volta em 3 dias. Dois acertos seguidos tiram a questão do caderno; errou, recomeça.
import { Router, type NextFunction, type Request, type Response } from 'express'
import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { requireAuth } from '../../middleware/requireAuth'
import { makeError } from '../../utils/errors'
import type { QuestionOption } from '../quiz/quiz.types'

const DAY = 86_400_000
const shuffleOptions = <T>(items: T[]) => items.map((item) => ({ item, r: Math.random() })).sort((a, b) => a.r - b.r).map(({ item }) => item)
/** Dias até a próxima revisão, pelo número de acertos seguidos (0 = acabou de errar). */
export const REVIEW_INTERVAL_DAYS = [1, 3]
export const STREAK_TO_RESOLVE = 2
export const REVIEW_SESSION_SIZE = 5

type Db = Prisma.TransactionClient | typeof prisma

interface AnsweredQuestion { id: string; topicId: string; officialRefId: string | null; source: string }

/** Chave estável da questão: a oficial canônica, ou a própria cópia em que o aluno errou. */
export function reviewKey(question: AnsweredQuestion, reviewKeys?: Record<string, string> | null): string {
  return reviewKeys?.[question.id] ?? question.officialRefId ?? question.id
}

/** Atualiza o caderno com uma resposta. Nunca derruba a resposta do aluno se falhar. */
export async function recordReviewAnswer(userId: string, question: AnsweredQuestion, isCorrect: boolean,
  reviewKeys?: Record<string, string> | null, now = new Date(), db: Db = prisma): Promise<void> {
  const questionKey = reviewKey(question, reviewKeys)
  const existing = await db.reviewItem.findUnique({ where: { userId_questionKey: { userId, questionKey } } })
  if (!isCorrect) {
    await db.reviewItem.upsert({
      where: { userId_questionKey: { userId, questionKey } },
      create: { userId, questionKey, sourceQuestionId: question.officialRefId ?? question.id, topicId: question.topicId,
        dueAt: new Date(now.getTime() + REVIEW_INTERVAL_DAYS[0]! * DAY), lastWrongAt: now },
      update: { correctStreak: 0, timesWrong: { increment: 1 }, resolvedAt: null, lastWrongAt: now,
        dueAt: new Date(now.getTime() + REVIEW_INTERVAL_DAYS[0]! * DAY) },
    })
    return
  }
  if (!existing || existing.resolvedAt) return
  const streak = existing.correctStreak + 1
  await db.reviewItem.update({
    where: { id: existing.id },
    data: streak >= STREAK_TO_RESOLVE
      ? { correctStreak: streak, resolvedAt: now }
      : { correctStreak: streak, dueAt: new Date(now.getTime() + REVIEW_INTERVAL_DAYS[Math.min(streak, REVIEW_INTERVAL_DAYS.length - 1)]! * DAY) },
  })
}

/** Erros de uma prova anterior entregue entram no caderno (questões oficiais canônicas). */
export async function recordExamMistakes(userId: string, questions: { id: string; topicId: string; options: unknown }[],
  answers: Record<string, string>, now = new Date()): Promise<void> {
  for (const q of questions) {
    const chosen = answers[q.id]
    if (!chosen) continue
    const options = q.options as QuestionOption[]
    const right = options.find((o) => o.isCorrect)
    const same = (a?: string, b?: string) => (a ?? '').replace(/\s+/g, ' ').trim().toLowerCase() === (b ?? '').replace(/\s+/g, ' ').trim().toLowerCase()
    const correct = options.find((o) => o.id === chosen)?.isCorrect || same(options.find((o) => o.id === chosen)?.text, right?.text)
    await recordReviewAnswer(userId, { id: q.id, topicId: q.topicId, officialRefId: q.id, source: 'OFFICIAL' }, Boolean(correct), null, now)
  }
}

async function overview(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!
    const now = new Date()
    const open = await prisma.reviewItem.findMany({
      where: { userId, resolvedAt: null }, orderBy: [{ dueAt: 'asc' }], take: 300,
      select: { id: true, questionKey: true, sourceQuestionId: true, topicId: true, dueAt: true, lastWrongAt: true, timesWrong: true, correctStreak: true },
    })
    const topicIds = [...new Set(open.map((i) => i.topicId))]
    const topics = await prisma.topic.findMany({ where: { id: { in: topicIds } }, select: { id: true, name: true, subject: { select: { name: true } } } })
    const topicById = new Map(topics.map((t) => [t.id, t]))
    const questions = await prisma.question.findMany({ where: { id: { in: open.map((i) => i.sourceQuestionId) } }, select: { id: true, body: true, origin: true } })
    const qById = new Map(questions.map((q) => [q.id, q]))
    const byTopic = new Map<string, { topicId: string; topicName: string; subjectName: string; due: number; open: number }>()
    for (const item of open) {
      const t = topicById.get(item.topicId)
      if (!t) continue
      const row = byTopic.get(item.topicId) ?? { topicId: item.topicId, topicName: t.name, subjectName: t.subject.name, due: 0, open: 0 }
      row.open++
      if (item.dueAt <= now) row.due++
      byTopic.set(item.topicId, row)
    }
    const resolved = await prisma.reviewItem.count({ where: { userId, resolvedAt: { not: null } } })
    res.json({
      due: open.filter((i) => i.dueAt <= now).length,
      open: open.length,
      resolved,
      topics: [...byTopic.values()].sort((a, b) => b.due - a.due || b.open - a.open),
      items: open.slice(0, 100).map((i) => {
        const q = qById.get(i.sourceQuestionId)
        const t = topicById.get(i.topicId)
        return { id: i.id, topicId: i.topicId, topicName: t?.name ?? '', subjectName: t?.subject.name ?? '',
          preview: (q?.body ?? '').replace(/\s+/g, ' ').slice(0, 140), origin: q?.origin ?? null,
          dueAt: i.dueAt, lastWrongAt: i.lastWrongAt, timesWrong: i.timesWrong, correctStreak: i.correctStreak }
      }),
    })
  } catch (err) { next(err) }
}

/** Cria uma sessão de revisão do tópico: primeiro as vencidas, depois as que ainda não venceram. */
async function startReview(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!
    const topicId = String(req.params.topicId)
    const now = new Date()
    const items = await prisma.reviewItem.findMany({ where: { userId, topicId, resolvedAt: null }, orderBy: { dueAt: 'asc' }, take: REVIEW_SESSION_SIZE })
    if (!items.length) throw makeError('Nenhuma questão para revisar neste tópico.', 404, 'NOTHING_TO_REVIEW')
    const sources = await prisma.question.findMany({ where: { id: { in: items.map((i) => i.sourceQuestionId) } } })
    const sourceById = new Map(sources.map((q) => [q.id, q]))
    const sessionId = await prisma.$transaction(async (tx) => {
      const session = await tx.quizSession.create({ data: { userId, topicId, isReview: true } })
      const reviewKeys: Record<string, string> = {}
      for (const item of items) {
        const src = sourceById.get(item.sourceQuestionId)
        if (!src) continue
        const official = src.source === 'OFFICIAL'
        const options = src.options as unknown as QuestionOption[]
        const copy = await tx.question.create({ data: {
          topicId, generatedForSessionId: session.id, body: src.body, imageUrl: src.imageUrl, media: src.media ?? undefined,
          // Oficial mantém a ordem da prova; as demais embaralham de novo para não decorar a posição.
          options: (official ? options : shuffleOptions(options)) as unknown as Prisma.InputJsonValue,
          explanation: src.explanation, explanationByAi: src.explanationByAi, difficulty: src.difficulty, source: src.source,
          officialRefId: official ? (src.officialRefId ?? src.id) : null, difficultySource: src.difficultySource, origin: src.origin, year: src.year,
        } })
        reviewKeys[copy.id] = item.questionKey
      }
      if (!Object.keys(reviewKeys).length) throw makeError('Nenhuma questão para revisar neste tópico.', 404, 'NOTHING_TO_REVIEW')
      await tx.quizSession.update({ where: { id: session.id }, data: { generationMetadata: {
        status: 'ready', source: 'REVIEW', reviewKeys, startedReviewAt: now.toISOString() } } })
      return session.id
    })
    res.status(201).json({ sessionId, jobId: `review-${sessionId}` })
  } catch (err) { next(err) }
}

export const reviewRouter = Router()
reviewRouter.get('/', requireAuth, overview)
reviewRouter.post('/:topicId/start', requireAuth, startReview)
