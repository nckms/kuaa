import { Router } from 'express'
import { requireAuth } from '../../middleware/requireAuth'
import * as trailController from './trail.controller'

export const trailRouter = Router()

trailRouter.get('/:vestibularSlug', requireAuth, trailController.getTrail)
trailRouter.get('/:vestibularSlug/next', requireAuth, trailController.getNextTopic)
