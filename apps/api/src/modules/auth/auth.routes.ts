import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { redis } from '../../lib/redis'
import { makeError } from '../../utils/errors'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import * as authController from './auth.controller'

export const authRouter = Router()

function rateLimiter(max: number, windowSeconds: number) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const ip = req.ip ?? 'unknown'
    const key = `rl:${req.path}:${ip}`
    try {
      const count = await redis.incr(key)
      if (count === 1) await redis.expire(key, windowSeconds)
      if (count > max) {
        next(makeError(`Muitas tentativas. Aguarde ${windowSeconds} segundos`, 429, 'RATE_LIMIT_EXCEEDED'))
        return
      }
      next()
    } catch {
      next()
    }
  }
}

authRouter.post('/register', rateLimiter(5, 3600), authController.register)
authRouter.post('/login', rateLimiter(10, 15 * 60), authController.login)
authRouter.post('/refresh', authController.refresh)
authRouter.delete('/logout', authController.logout)
// Recuperação de senha usa limite em memória: não depende do Redis, que não
// existe em produção (o rateLimiter acima libera tudo quando o Redis falta).
function memoryLimit(limit: number, windowMinutes: number) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000, limit, standardHeaders: true, legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip ?? ''),
    handler: (_req, res) => {
      res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.', code: 'RATE_LIMIT_EXCEEDED' })
    },
  })
}

authRouter.post('/forgot-password', memoryLimit(5, 60), authController.forgotPassword)
authRouter.post('/reset-password', memoryLimit(10, 15), authController.resetPassword)
