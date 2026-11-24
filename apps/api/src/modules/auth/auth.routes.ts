import { Router } from 'express'
import { authRateKeys, createAuthRateLimit } from '../../middleware/authRateLimit'
import rateLimit from 'express-rate-limit'
import * as authController from './auth.controller'

export const authRouter = Router()

authRouter.post('/register',
  ...createAuthRateLimit('register', 5, 3600, authRateKeys.ipAndEmail),
  ...createAuthRateLimit('register-ip', 60, 3600, authRateKeys.ip),
  authController.register)
authRouter.post('/login', ...createAuthRateLimit('login', 10, 15 * 60, authRateKeys.ipAndEmail), authController.login)
authRouter.post('/refresh', ...createAuthRateLimit('refresh', 30, 60, authRateKeys.session), authController.refresh)
authRouter.delete('/logout', authController.logout)
// Password recovery also keeps a local guard independent of Redis.
function memoryLimit(limit: number, windowMinutes: number, keyOf: (req: import('express').Request) => string = authRateKeys.ip) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000, limit, standardHeaders: true, legacyHeaders: false,
    keyGenerator: (req) => keyOf(req),
    handler: (_req, res) => {
      res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.', code: 'RATE_LIMIT_EXCEEDED' })
    },
  })
}

authRouter.post('/forgot-password', memoryLimit(5, 60, authRateKeys.ipAndEmail), authController.forgotPassword)
authRouter.post('/reset-password', memoryLimit(10, 15), authController.resetPassword)
