import { Router } from 'express'
import { prisma } from '../../lib/prisma'
import { requireAuth } from '../../middleware/requireAuth'
import { makeError } from '../../utils/errors'
import { getStudyGuide } from './guides'

export const studyRouter = Router()
studyRouter.use(requireAuth)

studyRouter.get('/topics/:topicId', async (req, res, next) => {
  try {
    const topic = await prisma.topic.findUnique({ where: { id: String(req.params.topicId) },
      select: { id: true, name: true, subject: { select: { name: true, vestibular: { select: { id: true, slug: true } } } } } })
    if (!topic) throw makeError('Topico nao encontrado.', 404, 'NOT_FOUND')
    const enrolled = await prisma.enrollment.findUnique({
      where: { userId_vestibularId: { userId: req.userId!, vestibularId: topic.subject.vestibular.id } }, select: { id: true },
    })
    if (!enrolled) throw makeError('Matricule-se neste vestibular primeiro.', 403, 'NOT_ENROLLED')
    const guide = getStudyGuide(topic.name)
    if (!guide) throw makeError('Material de estudo ainda nao disponivel para este topico.', 404, 'GUIDE_UNAVAILABLE')
    const mistakes = await prisma.userAnswer.findMany({
      where: { userId: req.userId!, isCorrect: false, question: { topicId: topic.id } },
      orderBy: { answeredAt: 'desc' }, take: 3,
      select: { id: true, question: { select: { body: true, explanation: true } } },
    })
    res.json({ topic: { id: topic.id, name: topic.name, subjectName: topic.subject.name,
      vestibularSlug: topic.subject.vestibular.slug }, guide,
    mistakes: mistakes.map(({ id, question }) => ({ id, body: question.body, explanation: question.explanation })) })
  } catch (error) { next(error) }
})
