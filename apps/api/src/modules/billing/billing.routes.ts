import { Router } from 'express'
import { requireAuth } from '../../middleware/requireAuth'
import { billingConfig, createCheckout } from './billing'

export const billingRouter = Router()
billingRouter.get('/config', billingConfig)
billingRouter.post('/checkout', requireAuth, createCheckout)
