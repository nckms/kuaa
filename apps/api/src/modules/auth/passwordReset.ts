import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '../../lib/prisma'
import { env } from '../../lib/env'
import { sendMail } from '../../lib/mailer'
import { makeError } from '../../utils/errors'

/** Intervalo mínimo entre dois e-mails para a mesma conta (silencioso para o cliente). */
const RESEND_COOLDOWN_MS = 60_000

export const hashResetToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex')

function appUrl(): string {
  const configured = env.APP_URL ?? env.FRONTEND_URL?.split(',')[0]?.trim() ?? 'http://localhost:5173'
  return configured.replace(/\/+$/, '')
}

/** O token vai no fragmento (#): navegadores não o enviam ao servidor nem no Referer. */
export function buildResetLink(token: string): string {
  return `${appUrl()}/redefinir-senha#token=${encodeURIComponent(token)}`
}

function resetEmail(name: string, link: string, minutes: number) {
  const firstName = name.split(/\s+/)[0] || 'estudante'
  const text = [
    `Olá, ${firstName}.`,
    '',
    'Recebemos um pedido para redefinir a senha da sua conta Kuaa.',
    `Abra o link abaixo em até ${minutes} minutos. Ele só pode ser usado uma vez.`,
    '',
    link,
    '',
    'Se você não pediu isso, ignore este e-mail: sua senha continua a mesma.',
  ].join('\n')
  const html = `<p>Olá, ${firstName.replace(/[<>&"]/g, '')}.</p>
<p>Recebemos um pedido para redefinir a senha da sua conta Kuaa.</p>
<p><a href="${link}">Redefinir minha senha</a></p>
<p>O link vale por ${minutes} minutos e só pode ser usado uma vez.</p>
<p>Se você não pediu isso, ignore este e-mail: sua senha continua a mesma.</p>`
  return { subject: 'Redefinição de senha — Kuaa', text, html }
}

/**
 * Cria um token de uso único e o envia por e-mail. Não revela se o e-mail existe:
 * quem chama responde sempre a mesma mensagem e não espera pela entrega.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findFirst({ where: { email: { equals: email.trim(), mode: 'insensitive' } } })
  if (!user) return

  const latest = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id }, orderBy: { createdAt: 'desc' }, select: { createdAt: true },
  })
  if (latest && Date.now() - latest.createdAt.getTime() < RESEND_COOLDOWN_MS) return

  const token = crypto.randomBytes(32).toString('base64url')
  const minutes = env.PASSWORD_RESET_TTL_MINUTES
  const now = new Date()
  await prisma.$transaction([
    // Um pedido novo invalida os anteriores ainda não usados.
    prisma.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: now } }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashResetToken(token), expiresAt: new Date(now.getTime() + minutes * 60_000) },
    }),
  ])

  const message = resetEmail(user.name, buildResetLink(token), minutes)
  await sendMail({ to: user.email, ...message })
}

/** Valida e consome o token atomicamente; troca a senha e encerra todas as sessões. */
export async function resetPassword(token: string, password: string): Promise<void> {
  const tokenHash = hashResetToken(token)
  const passwordHash = await bcrypt.hash(password, 12)
  const now = new Date()

  await prisma.$transaction(async (tx) => {
    const record = await tx.passwordResetToken.findUnique({ where: { tokenHash } })
    // Consumo condicional: duas requisições simultâneas não usam o mesmo token.
    const consumed = record
      ? await tx.passwordResetToken.updateMany({ where: { id: record.id, usedAt: null, expiresAt: { gt: now } }, data: { usedAt: now } })
      : { count: 0 }
    if (!record || consumed.count !== 1) {
      throw makeError('Link inválido ou expirado. Peça um novo link de redefinição.', 400, 'INVALID_RESET_TOKEN')
    }
    await tx.user.update({ where: { id: record.userId }, data: { passwordHash } })
    await tx.passwordResetToken.updateMany({ where: { userId: record.userId, usedAt: null }, data: { usedAt: now } })
    await tx.refreshToken.deleteMany({ where: { userId: record.userId } })
  })
}
