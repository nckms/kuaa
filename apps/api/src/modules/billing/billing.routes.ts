import { Router } from 'express'
import { requireAuth } from '../../middleware/requireAuth'
import { billingConfig, createCheckout, createPortal, mySubscription } from './billing'

export const billingRouter = Router()
billingRouter.get('/config', billingConfig)
billingRouter.get('/subscription', requireAuth, mySubscription)
billingRouter.post('/checkout', requireAuth, createCheckout)
billingRouter.post('/portal', requireAuth, createPortal)
