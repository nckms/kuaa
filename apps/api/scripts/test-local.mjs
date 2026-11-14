#!/usr/bin/env node
/**
 * Roda a suíte da API contra um PostgreSQL LOCAL e descartável.
 *
 *   npm run test:local --workspace=apps/api
 *
 * Usa TEST_DATABASE_URL se definida; senão, o padrão abaixo. O globalSetup
 * recusa qualquer destino que não seja local e não termine em `_test`.
 * Funciona igual no Windows (PowerShell/cmd) e no Linux/macOS.
 */
import { spawnSync } from 'node:child_process'

const DEFAULT_URL = 'postgresql://postgres@127.0.0.1:55433/kuaa_test'
const url = process.env.TEST_DATABASE_URL || DEFAULT_URL
const shown = url.replace(/\/\/([^:@/]+):[^@/]+@/, '//$1:***@')
console.log(`[test-local] TEST_DATABASE_URL=${shown}`)

const result = spawnSync('npx', ['vitest', 'run', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: { ...process.env, TEST_DATABASE_URL: url },
})
process.exit(result.status ?? 1)
