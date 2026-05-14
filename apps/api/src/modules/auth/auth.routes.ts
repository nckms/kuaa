import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { redis } from '../../lib/redis'
import { makeError } from '../../utils/errors'
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
authRouter.post('/forgot-password', rateLimiter(3, 3600), authController.forgotPassword)
authRouter.post('/reset-password', authController.resetPassword)
