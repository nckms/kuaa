import rateLimit from 'express-rate-limit'
import type { Request } from 'express'

export const quizGenerateRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  limit: 10,
  keyGenerator: (req: Request) => req.userId ?? req.ip ?? 'unknown',
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Muitas gerações de questão em pouco tempo. Aguarde alguns minutos.',
      code: 'RATE_LIMIT_EXCEEDED',
    })
  },
  standardHeaders: true,
  legacyHeaders: false,
})
