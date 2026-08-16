import { execSync } from 'child_process'
import { resolve } from 'path'
import { PrismaClient } from '@prisma/client'

const API_DIR = resolve(__dirname, '..', '..', '..') // apps/api

// Segurança: impede rodar testes contra banco sem schema de teste
function assertTestDatabase() {
  const url = process.env.DATABASE_URL ?? ''
  const isTestSchema = url.includes('schema=test') || url.includes('_test') || url.includes('test_vitest')
  const isLocalPg = url.includes('localhost') || url.includes('127.0.0.1')

  if (!isTestSchema && !isLocalPg) {
    throw new Error(
      '❌ DATABASE_URL em .env.test não parece ser um banco de teste.\n' +
      '   Adicione ?schema=test_vitest à URL ou use um banco local.\n' +
      '   Os testes NÃO rodam contra o banco de produção.',
    )
  }
}

export async function setup() {
  assertTestDatabase()

  // Criar schema de teste se usar schema separado na mesma instância
  const prisma = new PrismaClient()
  try {
    await prisma.$executeRawUnsafe('CREATE SCHEMA IF NOT EXISTS test_vitest')
  } catch {
    // Schema já existe ou DB não usa schemas — continua
  } finally {
    await prisma.$disconnect()
  }

  // Aplicar migrations no banco/schema de teste
  console.log('\n🔧 Aplicando migrations no banco de teste...')
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    cwd: API_DIR,
    env: { ...process.env },
  })

  // Seed: vestibulares + achievements (idempotente via upsert)
  console.log('🌱 Rodando seed no banco de teste...')
  execSync('npx prisma db seed', {
    stdio: 'inherit',
    cwd: API_DIR,
    env: { ...process.env },
  })

  console.log('✅ Banco de teste pronto\n')
}

export async function teardown() {
  const url = process.env.DATABASE_URL ?? ''
  // Só dropa o schema se for realmente um schema separado
  if (url.includes('schema=test_vitest')) {
    const prisma = new PrismaClient()
    try {
      await prisma.$executeRawUnsafe('DROP SCHEMA IF EXISTS test_vitest CASCADE')
      console.log('\n🗑️  Schema de teste descartado')
    } finally {
      await prisma.$disconnect()
    }
  }
}
