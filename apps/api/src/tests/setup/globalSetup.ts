import { execSync } from 'child_process'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'

const API_DIR = resolve(__dirname, '..', '..', '..') // apps/api
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

interface TestTarget {
  host: string
  port: string
  database: string
  schema: string
  isLocal: boolean
}

function describeTarget(): TestTarget {
  const raw = process.env.DATABASE_URL
  if (!raw) {
    throw new Error(
      '❌ Nenhum banco de teste configurado.\n' +
      '   Defina TEST_DATABASE_URL (ex.: postgresql://postgres@127.0.0.1:55433/kuaa_test)\n' +
      '   ou DATABASE_URL em apps/api/.env.test.',
    )
  }
  const url = new URL(raw)
  return {
    host: url.hostname,
    port: url.port || '5432',
    database: url.pathname.replace(/^\//, ''),
    schema: url.searchParams.get('schema') ?? 'public',
    isLocal: LOCAL_HOSTS.has(url.hostname),
  }
}

/**
 * Impede migrations, seed, TRUNCATE e DROP fora de um banco de teste.
 * Regras (todas obrigatórias):
 *  - banco com sufixo `_test` OU schema `test_vitest`;
 *  - host local, a menos que ALLOW_REMOTE_TEST_DB=1 E schema `test_vitest`.
 * Senha nunca é impressa.
 */
export function assertTestDatabase(stage: string): TestTarget {
  const target = describeTarget()
  const isTestSchema = target.schema === 'test_vitest'
  const isTestDatabase = target.database.endsWith('_test')

  console.log(
    `🔎 [${stage}] destino: host=${target.host} porta=${target.port} ` +
    `banco=${target.database} schema=${target.schema} local=${target.isLocal ? 'sim' : 'não'}`,
  )

  if (!isTestSchema && !isTestDatabase) {
    throw new Error(
      `❌ [${stage}] Destino recusado: o banco precisa terminar em _test ou usar ?schema=test_vitest.`,
    )
  }
  if (!target.isLocal && !(process.env.ALLOW_REMOTE_TEST_DB === '1' && isTestSchema)) {
    throw new Error(
      `❌ [${stage}] Destino remoto recusado (${target.host}). Use um Postgres local descartável ` +
      'ou, conscientemente, ALLOW_REMOTE_TEST_DB=1 com ?schema=test_vitest.',
    )
  }
  return target
}

export async function setup() {
  const target = assertTestDatabase('setup')

  if (target.schema === 'test_vitest') {
    const prisma = new PrismaClient()
    try {
      await prisma.$executeRawUnsafe('CREATE SCHEMA IF NOT EXISTS test_vitest')
    } finally {
      await prisma.$disconnect()
    }
  }

  console.log('🔧 Aplicando migrations no banco de teste...')
  execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: API_DIR, env: { ...process.env } })

  console.log('🌱 Rodando seed no banco de teste...')
  execSync('npx prisma db seed', { stdio: 'inherit', cwd: API_DIR, env: { ...process.env } })

  console.log('✅ Banco de teste pronto\n')
}

export async function teardown() {
  const target = assertTestDatabase('teardown')
  // Só derruba schema dedicado. Banco local *_test é mantido para inspeção e
  // é limpo por TRUNCATE no começo de cada arquivo de teste.
  if (target.schema === 'test_vitest') {
    const prisma = new PrismaClient()
    try {
      await prisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS test_vitest CASCADE')
      console.log('\n🗑️  Schema de teste descartado')
    } finally {
      await prisma.$disconnect()
    }
  }
}
