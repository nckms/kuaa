import 'dotenv/config'
import { app } from './app'
import { env } from './lib/env'
import { mailDeliveryConfigured } from './lib/mailer'
import { prisma } from './lib/prisma'
import { redis } from './lib/redis'
import { startReminderScheduler } from './modules/engagement/push'

const PORT = env.PORT ?? 3333

if (!mailDeliveryConfigured()) {
  console.warn('[Mail] Envio de e-mail não configurado: alunos não receberão links de redefinição de senha. ' +
    'Defina MAIL_TRANSPORT=smtp, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM e APP_URL.')
}

const server = app.listen(PORT, () => {
  console.log(`🦅 Kuaa API rodando na porta ${PORT}`)
})
startReminderScheduler()

let stopping = false
function shutdown() {
  if (stopping) return
  stopping = true
  app.locals.shuttingDown = true
  const deadline = setTimeout(() => process.exit(1), 25_000)
  deadline.unref()
  server.close(() => {
    void prisma.$disconnect().finally(() => {
      redis.disconnect()
      clearTimeout(deadline)
      process.exit(0)
    })
  })
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
