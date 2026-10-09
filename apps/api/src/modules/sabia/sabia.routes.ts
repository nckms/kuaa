import { Router } from 'express'
import { requireAuth } from '../../middleware/requireAuth'
import { sabiaRateLimit } from '../../middleware/sabiaRateLimit'
import { ask, history, conversations } from './sabia.controller'

export const sabiaRouter = Router()

sabiaRouter.use(requireAuth)
sabiaRouter.get('/history', history)
sabiaRouter.get('/conversations', conversations)
sabiaRouter.post('/ask', sabiaRateLimit, ask)
