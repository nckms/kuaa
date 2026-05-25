import type { ConnectionOptions } from 'bullmq'

export function getBullMQConnection(): ConnectionOptions {
  const raw = process.env.REDIS_URL ?? 'redis://localhost:6379'
  const url = new URL(raw)
  const conn: ConnectionOptions = {
    host: url.hostname,
    port: parseInt(url.port || '6379', 10),
  }
  if (url.password) conn.password = url.password
  if (url.username && url.username !== 'default') conn.username = url.username
  return conn
}
