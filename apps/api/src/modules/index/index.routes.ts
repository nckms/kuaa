import { Router } from 'express'
import { requireAuth } from '../../middleware/requireAuth'
import { getIndex } from './index.controller'

export const indexRouter = Router()

indexRouter.get('/:vestibularSlug', requireAuth, getIndex)
