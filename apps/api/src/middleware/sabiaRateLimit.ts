import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import type { Request } from 'express'

export const sabiaRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  limit: 20,
  keyGenerator: (req: Request) => req.userId ?? ipKeyGenerator(req.ip ?? ''),
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Muitas mensagens em pouco tempo. Aguarde um momento.',
      code: 'RATE_LIMIT_EXCEEDED',
    })
  },
  standardHeaders: true,
  legacyHeaders: false,
})
