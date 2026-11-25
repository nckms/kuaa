import { Router } from 'express'
import { requireAuth } from '../../middleware/requireAuth'
import { pushConfig, pushStatus, subscribePush, unsubscribePush } from './push'

export const pushRouter = Router()
pushRouter.get('/config', pushConfig)
pushRouter.get('/status', requireAuth, pushStatus)
pushRouter.post('/subscribe', requireAuth, subscribePush)
pushRouter.delete('/subscribe', requireAuth, unsubscribePush)
