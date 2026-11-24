import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { User } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { env } from '../../lib/env'
import { makeError } from '../../utils/errors'
import type { SafeUser } from '../../types/index'
import type { RegisterInput, LoginInput, ResetPasswordInput } from './auth.schemas'
import { requestPasswordReset, resetPassword } from './passwordReset'

const ACCESS_TOKEN_EXPIRES = '15m'
const REFRESH_TOKEN_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000
export const ROTATION_GRACE_MS = 30 * 1000
export const hashRefreshToken = (token: string) => `sha256:${crypto.createHash('sha256').update(token).digest('hex')}`

interface AuthTokens {
  accessToken: string
  refreshToken: string
}

interface AuthResult extends AuthTokens {
  user: SafeUser
}

function toSafeUser(user: User): SafeUser {
  const { passwordHash: _, ...safe } = user
  return safe
}

function generateAccessToken(userId: string, email: string): string {
  return jwt.sign({ userId, email }, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES,
  })
}

async function generateAndSaveRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('base64url')
  await prisma.refreshToken.create({
    data: {
      token: hashRefreshToken(token),
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
    },
  })
  return token
}

class AuthService {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await prisma.user.findUnique({ where: { email: input.email } })
    if (existing) throw makeError('E-mail já cadastrado', 409, 'EMAIL_IN_USE')

    const passwordHash = await bcrypt.hash(input.password, 12)

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        school: input.school,
        city: input.city,
        state: input.state,
        plan: 'FREE',
      },
    })

    const accessToken = generateAccessToken(user.id, user.email)
    const refreshToken = await generateAndSaveRefreshToken(user.id)

    return { user: toSafeUser(user), accessToken, refreshToken }
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await prisma.user.findUnique({ where: { email: input.email } })
    if (!user) throw makeError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS')

    const valid = await bcrypt.compare(input.password, user.passwordHash)
    if (!valid) throw makeError('Credenciais inválidas', 401, 'INVALID_CREDENTIALS')

    const accessToken = generateAccessToken(user.id, user.email)
    const refreshToken = await generateAndSaveRefreshToken(user.id)

    return { user: toSafeUser(user), accessToken, refreshToken }
  }

  async refresh(token: string, rotate = false): Promise<{ accessToken: string; refreshToken?: string }> {
    if (token.startsWith('sha256:')) throw makeError('Token invalido', 401, 'INVALID_TOKEN')
    const hash = hashRefreshToken(token)
    return prisma.$transaction(async (tx) => {
      // Existing plaintext sessions remain valid and are upgraded on first use.
      const stored = await tx.refreshToken.findFirst({
        where: { token: { in: [hash, token] }, expiresAt: { gt: new Date() } },
        include: { user: true },
      })
      if (!stored) throw makeError('Token invalido ou expirado', 401, 'INVALID_TOKEN')
      const accessToken = generateAccessToken(stored.user.id, stored.user.email)
      if (rotate) {
        // Rotação com janela curta: o token usado passa a expirar em
        // ROTATION_GRACE_MS em vez de sumir na hora. Sem isso, uma renovação
        // cuja resposta se perde (recarga no meio do pedido, duas abas, rede
        // móvel) derruba o aluno para o login. Depois da janela, o token antigo
        // deixa de valer.
        const graceEnd = new Date(Date.now() + ROTATION_GRACE_MS)
        await tx.refreshToken.updateMany({
          where: { id: stored.id, expiresAt: { gt: graceEnd } },
          data: { expiresAt: graceEnd, token: hash },
        })
        const replacement = crypto.randomBytes(32).toString('base64url')
        await tx.refreshToken.create({ data: {
          userId: stored.userId, token: hashRefreshToken(replacement),
          expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
        } })
        return { accessToken, refreshToken: replacement }
      }
      if (stored.token !== hash) {
        await tx.refreshToken.updateMany({ where: { id: stored.id, token }, data: { token: hash } })
      }
      return { accessToken }
    })
  }

  async logout(refreshToken: string): Promise<void> {
    if (refreshToken.startsWith('sha256:')) return
    await prisma.refreshToken.deleteMany({ where: { token: { in: [refreshToken, hashRefreshToken(refreshToken)] } } })
  }

  /** Nunca revela se o e-mail existe; veja passwordReset.ts. */
  async forgotPassword(email: string): Promise<void> {
    await requestPasswordReset(email)
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    await resetPassword(input.token, input.password)
  }

  async me(userId: string): Promise<SafeUser> {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw makeError('Usuário não encontrado', 404, 'NOT_FOUND')
    return toSafeUser(user)
  }
}

export const authService = new AuthService()
