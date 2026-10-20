import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { requireAuth } from '../../middleware/requireAuth'
import { makeError } from '../../utils/errors'
import { essayThemes, getEssayTheme } from './themes'
import { generateEssayFeedback } from './essayFeedback'
import { env } from '../../lib/env'

export const essaysRouter = Router()
essaysRouter.use(requireAuth)

const reviewSchema = z.object({ respondsToPrompt: z.boolean(), argumentSupported: z.boolean(),
  coherenceReviewed: z.boolean(), finalReview: z.boolean() }).strict()
const createSchema = z.object({ vestibularSlug: z.string().min(1), themeId: z.string().min(1) }).strict()
const saveSchema = z.object({ body: z.string().max(30000), selfReview: reviewSchema.optional() }).strict()

async function enrolledExam(userId: string, slug: string) {
  const enrollment = await prisma.enrollment.findFirst({ where: { userId, vestibular: { slug } },
    include: { vestibular: { select: { id: true, slug: true, name: true } } } })
  if (!enrollment) throw makeError('Matricule-se neste vestibular primeiro.', 403, 'NOT_ENROLLED')
  return enrollment.vestibular
}

async function ownEssay(userId: string, id: string) {
  const essay = await prisma.essayDraft.findUnique({ where: { id }, include: { vestibular: { select: { slug: true } } } })
  if (!essay || essay.userId !== userId) throw makeError('Redacao nao encontrada.', 404, 'NOT_FOUND')
  return essay
}

essaysRouter.get('/themes/:slug', async (req, res, next) => {
  try {
    const exam = await enrolledExam(req.userId!, String(req.params.slug))
    res.json({ vestibular: exam, themes: essayThemes[exam.slug] ?? [] })
  } catch (error) { next(error) }
})

essaysRouter.get('/', async (req, res, next) => {
  try {
    const slug = z.string().min(1).parse(req.query.vestibularSlug)
    const exam = await enrolledExam(req.userId!, slug)
    const essays = await prisma.essayDraft.findMany({ where: { userId: req.userId!, vestibularId: exam.id },
      orderBy: { updatedAt: 'desc' }, select: { id: true, themeTitle: true, textType: true,
        status: true, submittedAt: true, createdAt: true, updatedAt: true, body: true } })
    res.json(essays.map(({ body, ...essay }) => ({ ...essay, wordCount: body.trim() ? body.trim().split(/\s+/).length : 0 })))
  } catch (error) { next(error) }
})

essaysRouter.post('/', async (req, res, next) => {
  try {
    const { vestibularSlug, themeId } = createSchema.parse(req.body)
    const exam = await enrolledExam(req.userId!, vestibularSlug)
    const theme = getEssayTheme(exam.slug, themeId)
    if (!theme) throw makeError('Proposta nao encontrada.', 404, 'THEME_NOT_FOUND')
    const essay = await prisma.essayDraft.create({ data: { userId: req.userId!, vestibularId: exam.id,
      themeId: theme.id, themeTitle: theme.title, prompt: theme.prompt, textType: theme.textType } })
    res.status(201).json(essay)
  } catch (error) { next(error) }
})

essaysRouter.get('/:id', async (req, res, next) => {
  try { res.json(await ownEssay(req.userId!, String(req.params.id))) } catch (error) { next(error) }
})

essaysRouter.patch('/:id', async (req, res, next) => {
  try {
    const input = saveSchema.parse(req.body)
    const essay = await ownEssay(req.userId!, String(req.params.id))
    const saved = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "EssayDraft" WHERE id = ${essay.id} FOR UPDATE`
      const current = await tx.essayDraft.findUniqueOrThrow({ where: { id: essay.id } })
      if (current.status !== 'DRAFT') throw makeError('Redacao enviada nao pode ser alterada.', 409, 'ESSAY_SUBMITTED')
      return tx.essayDraft.update({ where: { id: essay.id },
        data: { body: input.body, ...(input.selfReview ? { selfReview: input.selfReview } : {}) } })
    })
    res.json(saved)
  } catch (error) { next(error) }
})

essaysRouter.post('/:id/submit', async (req, res, next) => {
  try {
    const essay = await ownEssay(req.userId!, String(req.params.id))
    if (essay.status === 'SUBMITTED') { res.json(essay); return }
    const submitted = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "EssayDraft" WHERE id = ${essay.id} FOR UPDATE`
      const current = await tx.essayDraft.findUniqueOrThrow({ where: { id: essay.id } })
      if (current.status === 'SUBMITTED') return current
      const words = current.body.trim().split(/\s+/).filter(Boolean)
      if (current.body.trim().length < 200 || words.length < 30) {
        throw makeError('Desenvolva mais seu texto antes de enviar (minimo de 30 palavras e 200 caracteres).', 400, 'ESSAY_TOO_SHORT')
      }
      return tx.essayDraft.update({ where: { id: essay.id }, data: { status: 'SUBMITTED', submittedAt: new Date() } })
    })
    res.json(submitted)
  } catch (error) { next(error) }
})

essaysRouter.post('/:id/feedback', async (req, res, next) => {
  try {
    z.object({ aiConsent: z.literal(true) }).strict().parse(req.body)
    const essay = await ownEssay(req.userId!, String(req.params.id))
    if (essay.status !== 'SUBMITTED') throw makeError('Envie sua redacao antes de solicitar analise.', 409, 'ESSAY_DRAFT')
    if (essay.feedback) { res.json(essay); return }
    if (!env.GEMINI_API_KEY?.trim()) throw makeError('Analise por IA indisponivel no momento.', 503, 'AI_UNAVAILABLE')
    const now = new Date()
    const claimed = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "EssayDraft" WHERE id = ${essay.id} FOR UPDATE`
      const current = await tx.essayDraft.findUniqueOrThrow({ where: { id: essay.id } })
      if (current.feedback) return false
      if (current.feedbackRequestedAt && now.getTime() - current.feedbackRequestedAt.getTime() < 120_000) {
        throw makeError('A analise ja esta em andamento.', 409, 'FEEDBACK_PENDING')
      }
      await tx.essayDraft.update({ where: { id: essay.id }, data: { feedbackRequestedAt: now, aiConsentAt: now } })
      return true
    })
    if (!claimed) { res.json(await ownEssay(req.userId!, essay.id)); return }
    try {
      const feedback = await generateEssayFeedback({ exam: essay.vestibular.slug, theme: essay.themeTitle,
        prompt: essay.prompt, textType: essay.textType, body: essay.body })
      await prisma.essayDraft.updateMany({ where: { id: essay.id, feedbackRequestedAt: now },
        data: { feedback: JSON.parse(JSON.stringify(feedback)), feedbackRequestedAt: null } })
      res.json(await ownEssay(req.userId!, essay.id))
    } catch (error) {
      await prisma.essayDraft.updateMany({ where: { id: essay.id, feedbackRequestedAt: now },
        data: { feedbackRequestedAt: null } })
      throw error
    }
  } catch (error) { next(error) }
})
