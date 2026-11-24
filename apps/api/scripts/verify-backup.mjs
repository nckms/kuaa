// Local rehearsal only. Never accepts production, remote hosts or arbitrary schemas.
import { PrismaClient } from '@prisma/client'
import { spawnSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const source = new URL(process.env.TEST_DATABASE_URL || 'postgresql://postgres@127.0.0.1:55433/kuaa_test')
if (!['127.0.0.1', 'localhost', '[::1]'].includes(source.hostname)
  || !source.pathname.endsWith('_test')
  || (source.searchParams.get('schema') ?? 'public') !== 'public') {
  throw new Error('Backup rehearsal requires a local *_test database with public schema')
}
const target = new URL(source)
target.pathname = `/kuaa_restore_${Date.now()}_test`
const folder = mkdtempSync(join(tmpdir(), 'kuaa-backup-test-'))
const backup = join(folder, 'database.dump')
const apiDir = dirname(dirname(fileURLToPath(import.meta.url)))
const bin = (name) => process.env.PG_BIN
  ? join(process.env.PG_BIN, `${name}${process.platform === 'win32' ? '.exe' : ''}`) : name
const pgEnv = {
  ...process.env, PGHOST: source.hostname, PGPORT: source.port || '5432',
  PGUSER: decodeURIComponent(source.username), PGPASSWORD: decodeURIComponent(source.password),
  PGCONNECT_TIMEOUT: '5',
}

function run(command, args, env = pgEnv) {
  const result = spawnSync(command, args, { env, cwd: apiDir, encoding: 'utf8' })
  if (result.status !== 0) throw new Error(`Backup rehearsal command failed: ${command}; exit=${result.status}`)
}

async function fingerprint(url) {
  const db = new PrismaClient({ datasources: { db: { url: url.toString() } } })
  try {
    const tables = await db.$queryRaw`SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`
    const checks = []
    for (const { table_name: name } of tables) {
      const identifier = `"${name.replaceAll('"', '""')}"`
      const [row] = await db.$queryRawUnsafe(`SELECT count(*)::text AS count,
        md5(coalesce(string_agg(to_jsonb(t)::text, '' ORDER BY to_jsonb(t)::text), '')) AS hash
        FROM public.${identifier} AS t`)
      checks.push({ table: name, ...row })
    }
    return JSON.stringify(checks)
  } finally { await db.$disconnect() }
}

const before = await fingerprint(source)
run(bin('pg_dump'), ['--format=custom', '--no-owner', '--no-acl', '--file', backup, source.pathname.slice(1)])
run(bin('createdb'), [target.pathname.slice(1)])
run(bin('pg_restore'), ['--exit-on-error', '--no-owner', '--no-acl', '--dbname', target.pathname.slice(1), backup])
if (await fingerprint(target) !== before) throw new Error('Restored data does not match source')
run(process.execPath, [fileURLToPath(import.meta.resolve('prisma/build/index.js')), 'migrate', 'deploy'],
  { ...process.env, DATABASE_URL: target.toString() })
if (await fingerprint(target) !== before) throw new Error('Migration changed restored data; inspect clone')
console.log(`PASS: all public tables match before/after restore and migrate deploy (${JSON.parse(before).length} tables).`)
console.log(`Local backup: ${backup}`)
console.log(`Local restored database retained for inspection: ${target.pathname.slice(1)}`)
