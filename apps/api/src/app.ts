import './lib/env' // valida env vars no boot — derruba o processo se faltar obrigatória
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { router } from './routes/index'
import { errorHandler } from './middleware/errorHandler'
import { env } from './lib/env'
import crypto from 'node:crypto'
import { stripeWebhook } from './modules/billing/billing'

const app = express()
app.disable('x-powered-by')
if (env.TRUST_PROXY) app.set('trust proxy', env.TRUST_PROXY.split(',').map((value) => value.trim()))
app.use((_req, res, next) => {
  res.locals.requestId = crypto.randomUUID()
  res.setHeader('X-Request-Id', res.locals.requestId)
  res.setHeader('Cache-Control', 'no-store')
  next()
})

const configuredOrigins =
  env.FRONTEND_URL?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? []

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://kuaatcc.netlify.app',
  ...configuredOrigins,
])

// Local preview links may use either loopback hostname, on the same port.
for (const origin of [...allowedOrigins]) {
  try {
    const url = new URL(origin)
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      url.hostname = url.hostname === 'localhost' ? '127.0.0.1' : 'localhost'
      allowedOrigins.add(url.origin)
    }
  } catch {
    // Invalid configured origins cannot match a browser Origin header.
  }
}

app.use(helmet())
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true)
        return
      }
      callback(null, false)
    },
    credentials: true,
  }),
)

if (env.NODE_ENV !== 'test') {
  morgan.token('safe-path', (req) => req.url?.split('?')[0] ?? '/')
  morgan.token('request-id', (_req, res) => String(res.getHeader('X-Request-Id') ?? ''))
  app.use(morgan(':request-id :method :safe-path :status :response-time ms'))
}

// Webhook da Stripe precisa do corpo cru para validar a assinatura.
app.post('/api/v1/billing/webhook', express.raw({ type: 'application/json', limit: '1mb' }), stripeWebhook)
app.use(express.json())
app.use('/api/v1', router)
app.use(errorHandler)

export { app }
