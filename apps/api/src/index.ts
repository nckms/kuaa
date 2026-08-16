import 'dotenv/config'
import { app } from './app'
import { env } from './lib/env'

const PORT = env.PORT ?? 3333

app.listen(PORT, () => {
  console.log(`🦅 Kuaa API rodando na porta ${PORT}`)
})
