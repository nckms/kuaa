import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'
import { existsSync } from 'fs'
import { resolve } from 'path'

// Ordem de precedência do banco de teste:
//   1. TEST_DATABASE_URL (recomendado: Postgres local descartável)
//   2. DATABASE_URL definido em apps/api/.env.test (opcional)
// O destino é validado em src/tests/setup/globalSetup.ts antes de qualquer
// migration, seed ou teardown.
const testDatabaseUrl = process.env.TEST_DATABASE_URL
const envTestPath = resolve(__dirname, '.env.test')
if (existsSync(envTestPath)) config({ path: envTestPath, override: true })
if (testDatabaseUrl) process.env.DATABASE_URL = testDatabaseUrl

process.env.NODE_ENV = 'test'
// Segredo fixo só para testes; nunca é usado fora do processo do vitest.
process.env.JWT_SECRET ||= 'kuaa_test_secret_nao_usar_em_producao'
// Sem chave: a geração cai na reserva curada/determinística. Testes com IA usam mock.
process.env.GEMINI_API_KEY = ''
process.env.REDIS_URL = ''
// E-mail em modo de desenvolvimento: mensagens ficam na caixa em memória.
process.env.MAIL_TRANSPORT = 'memory'
process.env.APP_URL ||= 'http://localhost:5173'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    globalSetup: ['./src/tests/setup/globalSetup.ts'],
    fileParallelism: false, // testes de integração compartilham banco — rodar sequencialmente
    testTimeout: 30000,
    hookTimeout: 30000,
    include: ['src/tests/**/*.test.ts'],
  },
})
