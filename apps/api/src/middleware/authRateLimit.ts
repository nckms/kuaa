import crypto from 'node:crypto'
import rateLimit, { ipKeyGenerator, MemoryStore } from 'express-rate-limit'
import type { Request, RequestHandler } from 'express'
import { redis } from '../lib/redis'

export const authLimitStores: MemoryStore[] = []

// The local guard always counts, so Redis failures cannot reset the allowance.
// Redis adds a shared ceiling across replicas when available.
const sha = (value: string) => crypto.createHash('sha256').update(value).digest('hex')
const clientIp = (req: Request) => ipKeyGenerator(req.ip ?? '')

/**
 * Chaves de limite. Atrás do proxy da Vercel (sem TRUST_PROXY), req.ip é o IP
 * do proxy, igual para todos os alunos. Limitar só por IP bloquearia o site
 * inteiro; por isso login/cadastro contam por IP+e-mail e a renovação por
 * sessão. Nenhuma chave guarda e-mail ou token em claro.
 */
export const authRateKeys = {
  ip: (req: Request) => clientIp(req),
  ipAndEmail: (req: Request) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    return `${clientIp(req)}:${sha(email)}`
  },
  session: (req: Request) => {
    const cookie = req.headers.cookie?.split(';').map((part) => part.trim()).find((part) => part.startsWith('kuaa_session='))
    const bodyToken = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : ''
    const token = cookie?.slice('kuaa_session='.length) || bodyToken
    return token ? `s:${sha(token)}` : `ip:${clientIp(req)}`
  },
}

export function createAuthRateLimit(
  name: string, limit: number, windowSeconds: number,
  keyOf: (req: Request) => string = authRateKeys.ip,
): RequestHandler[] {
  const store = new MemoryStore()
  authLimitStores.push(store)
  const local = rateLimit({
    store,
    windowMs: windowSeconds * 1000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => keyOf(req),
    handler: (_req, res) => {
      res.status(429).json({ error: 'Muitas tentativas. Aguarde e tente novamente.', code: 'RATE_LIMIT_EXCEEDED' })
    },
  })
  const shared: RequestHandler = async (req, res, next) => {
    if (redis.status !== 'ready') { next(); return }
    const key = `auth-rate:${name}:${sha(keyOf(req))}`
    try {
      const count = Number(await redis.eval(
        "local n = redis.call('INCR', KEYS[1]); if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end; return n",
        1, key, windowSeconds,
      ))
      if (count > limit) {
        res.setHeader('Retry-After', String(windowSeconds))
        res.status(429).json({ error: 'Muitas tentativas. Aguarde e tente novamente.', code: 'RATE_LIMIT_EXCEEDED' })
        return
      }
    } catch {
      // The in-process guard has already enforced its limit.
    }
    next()
  }
  return [local, shared]
}
