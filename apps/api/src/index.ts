import 'dotenv/config'
import { execFileSync } from 'node:child_process'
import { app } from './app'
import { env } from './lib/env'

const PORT = env.PORT ?? 3333

// Railway currently overrides the Docker entrypoint with `node dist/index.js`.
// Keep catalog seeding on startup until that service setting is removed.
if (process.env.RAILWAY_ENVIRONMENT_NAME) {
  execFileSync('npx', ['prisma', 'db', 'seed'], { stdio: 'inherit' })
}

app.listen(PORT, () => {
  console.log(`🦅 Kuaa API rodando na porta ${PORT}`)
})
