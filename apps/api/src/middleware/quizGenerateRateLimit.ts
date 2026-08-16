import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import type { Request } from 'express'

export const quizGenerateRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  limit: 10,
  // Usa userId autenticado como chave; cai para IP (com helper IPv6-safe) se não tiver userId
  keyGenerator: (req: Request) => req.userId ?? ipKeyGenerator(req),
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Muitas gerações de questão em pouco tempo. Aguarde alguns minutos.',
      code: 'RATE_LIMIT_EXCEEDED',
    })
  },
  standardHeaders: true,
  legacyHeaders: false,
})
