import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'
import { resolve } from 'path'

// Carrega .env.test antes de qualquer coisa — sobrescreve vars já definidas
const testDatabaseUrl = process.env.TEST_DATABASE_URL
config({ path: resolve(__dirname, '.env.test'), override: true })
if (testDatabaseUrl) process.env.DATABASE_URL = testDatabaseUrl
process.env.NODE_ENV = 'test'
process.env.GEMINI_API_KEY = ''
process.env.REDIS_URL = ''

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
