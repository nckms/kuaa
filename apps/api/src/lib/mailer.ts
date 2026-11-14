import nodemailer, { type Transporter } from 'nodemailer'
import { env } from './env'

export interface MailMessage {
  to: string
  subject: string
  text: string
  html: string
}

/** Caixa em memória usada nos testes (MAIL_TRANSPORT=memory). */
export const memoryOutbox: MailMessage[] = []

let transporter: Transporter | null = null

function getTransporter(): Transporter {
  if (!transporter) {
    if (!env.SMTP_HOST) throw new Error('SMTP_HOST ausente com MAIL_TRANSPORT=smtp')
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  }
  return transporter
}

export function mailDeliveryConfigured(): boolean {
  return env.MAIL_TRANSPORT === 'memory' || (env.MAIL_TRANSPORT === 'smtp' && !!env.SMTP_HOST)
}

/**
 * Envia um e-mail. Retorna `true` se o transporte aceitou a mensagem.
 * Nunca registra o conteúdo (que pode conter links com tokens).
 */
export async function sendMail(message: MailMessage): Promise<boolean> {
  if (env.MAIL_TRANSPORT === 'memory') {
    memoryOutbox.push(message)
    return true
  }
  if (env.MAIL_TRANSPORT !== 'smtp') {
    console.warn('[Mail] Envio desativado (MAIL_TRANSPORT=disabled); mensagem descartada.')
    return false
  }
  try {
    await getTransporter().sendMail({ from: env.MAIL_FROM, ...message })
    return true
  } catch (error) {
    const reason = error instanceof Error ? error.message.slice(0, 120) : 'erro desconhecido'
    console.error(`[Mail] Falha ao entregar mensagem: ${reason}`)
    return false
  }
}
