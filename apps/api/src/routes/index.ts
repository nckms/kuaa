import { Router } from 'express'
import { mailDeliveryConfigured } from '../lib/mailer'
import { authRouter } from '../modules/auth/auth.routes'
import { usersRouter } from '../modules/users/users.routes'
import { vestibularesRouter } from '../modules/vestibulares/vestibulares.routes'
import { enrollmentsRouter } from '../modules/enrollments/enrollments.routes'
import { trailRouter } from '../modules/trail/trail.routes'
import { quizRouter } from '../modules/quiz/quiz.routes'
import { indexRouter } from '../modules/index/index.routes'
import { rankingRouter } from '../modules/ranking/ranking.routes'
import { simuladoRouter } from '../modules/simulado/simulado.routes'
import { sabiaRouter } from '../modules/sabia/sabia.routes'
import { evaluationRouter } from '../modules/evaluation/evaluation.routes'
import { diagnosticRouter } from '../modules/diagnostic/diagnostic.routes'
import { studyRouter } from '../modules/study/study.routes'
import { essaysRouter } from '../modules/essays/essays.routes'
import { prisma } from '../lib/prisma'
import { billingRouter } from '../modules/billing/billing.routes'
import { adminStudentsRouter, studentsRouter } from '../modules/students/students'
import { pushRouter } from '../modules/engagement/push.routes'
import { redis } from '../lib/redis'

export const router = Router()

router.get('/ready', async (req, res) => {
  if (req.app.locals.shuttingDown) { res.status(503).json({ status: 'unavailable' }); return }
  try {
    await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SET LOCAL statement_timeout = '2000ms'`
      await tx.$queryRaw`SELECT 1`
    }, { maxWait: 2000, timeout: 3000 })
    res.json({ status: 'ready', database: 'ready', cache: redis.status === 'ready' ? 'ready' : 'degraded' })
  } catch {
    res.status(503).json({ status: 'unavailable', database: 'unavailable' })
  }
})

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', project: 'Kuaa API', timestamp: new Date(),
    // Indica apenas se há transporte de e-mail configurado; não confirma entrega.
    passwordResetEmail: mailDeliveryConfigured() ? 'configured' : 'not_configured' })
})

router.get('/ping', (_req, res) => {
  res.json({ pong: true })
})

router.use('/auth', authRouter)
router.use('/users', usersRouter)
router.use('/billing', billingRouter)
router.use('/students', studentsRouter)
router.use('/admin/student-verifications', adminStudentsRouter)
router.use('/vestibulares', vestibularesRouter)
router.use('/enrollments', enrollmentsRouter)
router.use('/trail', trailRouter)
router.use('/quiz', quizRouter)
router.use('/index', indexRouter)
router.use('/ranking', rankingRouter)
router.use('/simulado', simuladoRouter)
router.use('/sabia', sabiaRouter)
router.use('/evaluation', evaluationRouter)
router.use('/diagnostic', diagnosticRouter)
router.use('/study', studyRouter)
router.use('/essays', essaysRouter)
router.use('/push', pushRouter)
