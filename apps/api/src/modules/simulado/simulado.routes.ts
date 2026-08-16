import { Router } from 'express'
import { requireAuth } from '../../middleware/requireAuth'
import { startHandler, currentHandler, getAttemptHandler, answerHandler, flagHandler, finishHandler } from './simulado.controller'

export const simuladoRouter = Router()

// Vestibular-scoped routes
simuladoRouter.post('/:vestibularSlug/start', requireAuth, startHandler)
simuladoRouter.get('/:vestibularSlug/current', requireAuth, currentHandler)

// Attempt-scoped routes
simuladoRouter.get('/attempt/:attemptId', requireAuth, getAttemptHandler)
simuladoRouter.patch('/attempt/:attemptId/answer', requireAuth, answerHandler)
simuladoRouter.patch('/attempt/:attemptId/flag', requireAuth, flagHandler)
simuladoRouter.post('/attempt/:attemptId/finish', requireAuth, finishHandler)
