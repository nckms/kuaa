import { Router } from 'express'
import { requireAuth } from '../../middleware/requireAuth'
import { sabiaRateLimit } from '../../middleware/sabiaRateLimit'
import { ask } from './sabia.controller'

export const sabiaRouter = Router()

sabiaRouter.post('/ask', requireAuth, sabiaRateLimit, ask)
