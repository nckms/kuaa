import Redis from 'ioredis'
import { env } from './env'

let reportedConnectionError = false

export const redis = new Redis(env.REDIS_URL ?? 'redis://localhost:6379', {
  enableOfflineQueue: false,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
})

redis.on('error', (err) => {
  if (reportedConnectionError) return
  reportedConnectionError = true
  console.warn('[Redis] Indisponivel; recursos de cache/fila seguirao em modo degradado:', err.message)
})

redis.on('connect', () => {
  reportedConnectionError = false
  console.log('[Redis] Conectado')
})
