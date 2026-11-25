import { Router } from 'express'
import { requireAuth } from '../../middleware/requireAuth'
import { billingConfig, createCheckout, createPortal, mySubscription } from './billing'
import { myInterest, registerInterest } from '../plans/signals'

export const billingRouter = Router()
billingRouter.get('/config', billingConfig)
billingRouter.get('/subscription', requireAuth, mySubscription)
billingRouter.post('/checkout', requireAuth, createCheckout)
billingRouter.post('/portal', requireAuth, createPortal)
billingRouter.get('/interest', requireAuth, myInterest)
billingRouter.post('/interest', requireAuth, registerInterest)
