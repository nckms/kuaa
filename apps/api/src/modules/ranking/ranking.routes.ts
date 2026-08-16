import { Router } from 'express'
import { requireAuth } from '../../middleware/requireAuth'
import { getRankingHandler } from './ranking.controller'

export const rankingRouter = Router()

rankingRouter.get('/:vestibularSlug', requireAuth, getRankingHandler)
