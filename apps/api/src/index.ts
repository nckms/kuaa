import 'dotenv/config'
import './lib/env' // valida env vars no boot — derruba o processo se faltar obrigatória
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { router } from './routes/index'
import { errorHandler } from './middleware/errorHandler'

const app = express()

const configuredOrigins =
  process.env.FRONTEND_URL?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? []

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://kuaatcc.netlify.app',
  ...configuredOrigins,
])

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
app.use(morgan('dev'))
app.use(express.json())

app.use('/api/v1', router)

app.use(errorHandler)

const PORT = process.env.PORT ?? 3333

app.listen(PORT, () => {
  console.log(`🦅 Kuaa API rodando na porta ${PORT}`)
})
