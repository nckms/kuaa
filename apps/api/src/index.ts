import 'dotenv/config'
import { execFileSync } from 'node:child_process'
import { app } from './app'
import { env } from './lib/env'
import { mailDeliveryConfigured } from './lib/mailer'

const PORT = env.PORT ?? 3333

// Railway currently overrides the Docker entrypoint with `node dist/index.js`.
// Keep catalog seeding on startup until that service setting is removed.
if (process.env.RAILWAY_ENVIRONMENT_NAME) {
  execFileSync('npx', ['prisma', 'db', 'seed'], { stdio: 'inherit' })
}

if (!mailDeliveryConfigured()) {
  console.warn('[Mail] Envio de e-mail não configurado: alunos não receberão links de redefinição de senha. ' +
    'Defina MAIL_TRANSPORT=smtp, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM e APP_URL.')
}

app.listen(PORT, () => {
  console.log(`🦅 Kuaa API rodando na porta ${PORT}`)
})
