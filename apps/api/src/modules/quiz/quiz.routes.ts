import { Router } from 'express'
import { requireAuth } from '../../middleware/requireAuth'
import { quizGenerateRateLimit } from '../../middleware/quizGenerateRateLimit'
import * as quizController from './quiz.controller'

export const quizRouter = Router()

quizRouter.post('/generate', requireAuth, quizGenerateRateLimit, quizController.generate)
quizRouter.get('/job/:jobId', requireAuth, quizController.getJobStatus)
quizRouter.get('/:sessionId/summary', requireAuth, quizController.getSummary)
quizRouter.get('/:sessionId', requireAuth, quizController.getSession)
quizRouter.post('/:sessionId/answer', requireAuth, quizController.answer)
quizRouter.post('/:sessionId/finish', requireAuth, quizController.finish)
