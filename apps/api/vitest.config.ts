import { defineConfig } from 'vitest/config'
import { config } from 'dotenv'
import { resolve } from 'path'

// Carrega .env.test antes de qualquer coisa — sobrescreve vars já definidas
config({ path: resolve(__dirname, '.env.test'), override: true })

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
