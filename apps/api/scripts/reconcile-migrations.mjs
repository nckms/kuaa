// Reconciliação única do histórico de migrations da produção.
//
// A produção foi criada com `prisma db push` em parte da sua vida: as tabelas
// destas 5 migrations já existem, mas não estão em _prisma_migrations, e o
// `migrate deploy` tentaria recriá-las (e falharia). Este script roda antes
// do `migrate deploy` em todo boot e é idempotente:
//   - migration já registrada            -> nada a fazer
//   - estrutura TODA presente, sem registro -> marca como aplicada (resolve --applied)
//   - estrutura ausente                    -> deixa para o migrate deploy criar
//   - estrutura PARCIAL                    -> aborta (exit 1): exige olhar humano
// Nunca cria, altera ou apaga tabelas nem dados.
import { PrismaClient } from '@prisma/client'
import { spawnSync } from 'node:child_process'

const BASELINE = [
  ['20260930000100_sabia_conversations', [
    ['table', 'SabiaConversation'], ['column', 'SabiaMessage', 'conversationId'],
    ['index', 'SabiaConversation_userId_updatedAt_idx'], ['index', 'SabiaMessage_conversationId_createdAt_idx'],
  ]],
  ['20261011000100_question_media', [['column', 'Question', 'media']]],
  ['20261015000100_enrollment_diagnostic', [['column', 'Enrollment', 'diagnostic']]],
  ['20261020000100_essay_practice', [['type', 'EssayStatus'], ['table', 'EssayDraft'], ['index', 'EssayDraft_userId_createdAt_idx']]],
  ['20261020000200_essay_feedback', [
    ['column', 'EssayDraft', 'feedback'], ['column', 'EssayDraft', 'feedbackRequestedAt'], ['column', 'EssayDraft', 'aiConsentAt'],
  ]],
]

const prisma = new PrismaClient()
const one = async (sql, ...params) => Number((await prisma.$queryRawUnsafe(sql, ...params))[0]?.n ?? 0)

async function exists([kind, a, b]) {
  if (kind === 'table') return await one(`SELECT count(*)::int n FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = $1`, a) > 0
  if (kind === 'column') return await one(`SELECT count(*)::int n FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1 AND column_name = $2`, a, b) > 0
  if (kind === 'index') return await one(`SELECT count(*)::int n FROM pg_indexes WHERE schemaname = current_schema() AND indexname = $1`, a) > 0
  if (kind === 'type') return await one(`SELECT count(*)::int n FROM pg_type t JOIN pg_namespace s ON s.oid = t.typnamespace WHERE s.nspname = current_schema() AND t.typname = $1`, a) > 0
  throw new Error(`marcador desconhecido: ${kind}`)
}

try {
  const hasHistory = await one(`SELECT count(*)::int n FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = '_prisma_migrations'`) > 0
  if (!hasHistory) { console.log('[reconcile] banco sem histórico Prisma: migrate deploy cuida de tudo.'); process.exit(0) }
  const recorded = new Set((await prisma.$queryRawUnsafe(
    `SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`)).map((r) => r.migration_name))
  const toResolve = []
  for (const [name, markers] of BASELINE) {
    if (recorded.has(name)) continue
    const present = await Promise.all(markers.map(exists))
    const count = present.filter(Boolean).length
    if (count === 0) { console.log(`[reconcile] ${name}: estrutura ausente; migrate deploy vai aplicar.`); continue }
    if (count < markers.length) {
      console.error(`[reconcile] ${name}: estrutura PARCIAL (${count}/${markers.length}). Abortando sem alterar nada.`)
      process.exit(1)
    }
    toResolve.push(name)
  }
  await prisma.$disconnect()
  for (const name of toResolve) {
    const r = spawnSync('npx', ['prisma', 'migrate', 'resolve', '--applied', name], { stdio: 'inherit' })
    if (r.status !== 0) { console.error(`[reconcile] falha ao registrar ${name}.`); process.exit(1) }
    console.log(`[reconcile] ${name}: estrutura completa encontrada; registrada como aplicada.`)
  }
  if (!toResolve.length) console.log('[reconcile] histórico já consistente.')
} finally {
  await prisma.$disconnect().catch(() => {})
}
