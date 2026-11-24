import type { Request, Response } from 'express'
import { env } from '../../lib/env'
import { makeError } from '../../utils/errors'

const COOKIE = 'kuaa_session'
const options = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/api/v1/auth',
}

export function isBrowserSession(req: Request): boolean {
  return req.get('X-Kuaa-Client') === 'web'
}

export function assertBrowserOrigin(req: Request): void {
  const allowed = new Set((env.FRONTEND_URL ?? '').split(',').map((origin) => origin.trim()).filter(Boolean))
  if (env.APP_URL) allowed.add(new URL(env.APP_URL).origin)
  if (env.NODE_ENV !== 'production') {
    for (const port of ['5173', '5190', '5191']) {
      allowed.add(`http://localhost:${port}`)
      allowed.add(`http://127.0.0.1:${port}`)
    }
  }
  const origin = req.get('Origin')
  // Custom header plus exact Origin check prevents CSRF, including sibling sites.
  if (!origin || !allowed.has(origin)) throw makeError('Origem nao autorizada', 403, 'INVALID_ORIGIN')
}

export function browserToken(req: Request): string | undefined {
  const value = req.headers.cookie?.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1)
  if (!value) return undefined
  try { return decodeURIComponent(value) } catch { return undefined }
}

export function setBrowserSession(res: Response, token: string): void {
  res.cookie(COOKIE, token, { ...options, maxAge: 7 * 24 * 60 * 60 * 1000 })
}

export function clearBrowserSession(res: Response): void {
  res.clearCookie(COOKIE, options)
}
