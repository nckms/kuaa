import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'
import { env } from '../lib/env'
import { makeError } from '../utils/errors'

interface AccessTokenPayload {
  userId: string
  email: string
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      throw makeError('Token não fornecido', 401, 'TOKEN_MISSING')
    }

    const token = authHeader.slice(7)

    let payload: AccessTokenPayload
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload
    } catch {
      throw makeError('Token inválido ou expirado', 401, 'INVALID_TOKEN')
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) throw makeError('Token inválido ou expirado', 401, 'INVALID_TOKEN')

    const { passwordHash: _, ...safeUser } = user
    req.user = safeUser
    req.userId = user.id

    next()
  } catch (err) {
    next(err)
  }
}
