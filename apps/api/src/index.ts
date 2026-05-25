import 'dotenv/config'
import './jobs/quizGenerationWorker'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { router } from './routes/index'
import { errorHandler } from './middleware/errorHandler'

const app = express()

app.use(helmet())
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
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
