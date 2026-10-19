import './lib/env' // valida env vars no boot — derruba o processo se faltar obrigatória
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { router } from './routes/index'
import { errorHandler } from './middleware/errorHandler'
import { env } from './lib/env'

const app = express()

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
  app.use(morgan('dev'))
}

app.use(express.json())
app.use('/api/v1', router)
app.use(errorHandler)

export { app }
