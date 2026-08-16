import { Router } from 'express'
import { authRouter } from '../modules/auth/auth.routes'
import { usersRouter } from '../modules/users/users.routes'
import { vestibularesRouter } from '../modules/vestibulares/vestibulares.routes'
import { enrollmentsRouter } from '../modules/enrollments/enrollments.routes'
import { trailRouter } from '../modules/trail/trail.routes'
import { quizRouter } from '../modules/quiz/quiz.routes'
import { indexRouter } from '../modules/index/index.routes'
import { rankingRouter } from '../modules/ranking/ranking.routes'

export const router = Router()

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', project: 'Kuaa API', timestamp: new Date() })
})

router.get('/ping', (_req, res) => {
  res.json({ pong: true })
})

router.use('/auth', authRouter)
router.use('/users', usersRouter)
router.use('/vestibulares', vestibularesRouter)
router.use('/enrollments', enrollmentsRouter)
router.use('/trail', trailRouter)
router.use('/quiz', quizRouter)
router.use('/index', indexRouter)
router.use('/ranking', rankingRouter)
