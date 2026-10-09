import { Router } from 'express'
import { requireAuth } from '../../middleware/requireAuth'
import { getMine, saveMine } from './evaluation.controller'

export const evaluationRouter = Router()
evaluationRouter.get('/me', requireAuth, getMine)
evaluationRouter.post('/me', requireAuth, saveMine)
