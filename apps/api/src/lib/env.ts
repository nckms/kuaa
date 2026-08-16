import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  // JWT_REFRESH_SECRET removido: refresh token usa crypto.randomUUID() persistido no banco,
  // não JWT assinado — a variável estava no .env por legado sem uso real no código.
  PORT: z.string().default('3333'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Opcionais — o sistema já degrada bem sem eles
  OPENAI_API_KEY: z.string().optional(),
  REDIS_URL: z.string().optional(),
  FRONTEND_URL: z.string().optional(),
})

function validateEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const missing = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    console.error('❌ Variáveis de ambiente obrigatórias ausentes ou inválidas:')
    missing.forEach((m) => console.error(m))
    process.exit(1)
  }
  return result.data
}

export const env = validateEnv()
