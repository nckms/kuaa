// Funil de ativação e retenção do Kuaa. SOMENTE LEITURA.
//
// Uso (PowerShell, DATABASE_URL já definido na sessão, sem colar a URL em logs):
//   npm run metrics --workspace=apps/api
//   npm run metrics --workspace=apps/api -- --weeks 12 --exclude-domain escola.com.br
//   npm run metrics --workspace=apps/api -- --include-test   (conta também as contas de teste)
//
// Roda dentro de uma transação READ ONLY: qualquer escrita acidental falha no
// próprio Postgres. A saída é só agregada (contagens por semana de cadastro);
// nenhum nome, e-mail ou id sai no terminal.
import { PrismaClient } from '@prisma/client'

const args = process.argv.slice(2)
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback
}
const weeks = Math.min(52, Math.max(1, Number(arg('weeks', '8')) || 8))
const excluded = args.flatMap((value, i) => (args[i - 1] === '--exclude-domain' ? [value.toLowerCase()] : []))
// Contas de teste ficam fora por padrão (e-mails com test, teste, example, qa., kuaa-test).
// Use --include-test para contar todas.
const TEST_PATTERN = args.includes('--include-test') ? '^$' : '(test|teste|example|qa\\.|kuaa-test)'

const prisma = new PrismaClient()

// Atividade de estudo = resposta de questão, simulado iniciado, mensagem ao
// Sabiá ou redação. "Voltou na semana 2" = alguma atividade entre o 7º e o 13º
// dia depois do cadastro.
const SQL = `
WITH params AS (
  SELECT date_trunc('week', now()) - ($1::int - 1) * interval '1 week' AS since
),
users AS (
  SELECT u.id, u."createdAt" AS signup, date_trunc('week', u."createdAt") AS cohort
  FROM "User" u, params
  WHERE u."createdAt" >= params.since
    AND NOT (lower(split_part(u.email, '@', 2)) = ANY($2::text[]))
    AND NOT (lower(u.email) ~ $3)
),
activity AS (
  SELECT "userId", "answeredAt" AS at FROM "UserAnswer"
  UNION ALL SELECT "userId", "startedAt" FROM "SimuladoAttempt"
  UNION ALL SELECT "userId", "createdAt" FROM "SabiaMessage"
  UNION ALL SELECT "userId", "createdAt" FROM "EssayDraft"
),
per_user AS (
  SELECT
    u.cohort,
    u.id,
    EXISTS (SELECT 1 FROM "Enrollment" e WHERE e."userId" = u.id) AS enrolled,
    EXISTS (SELECT 1 FROM "Enrollment" e WHERE e."userId" = u.id AND e.diagnostic ->> 'finishedAt' IS NOT NULL) AS diagnosed,
    EXISTS (SELECT 1 FROM "UserAnswer" a WHERE a."userId" = u.id) AS practiced,
    EXISTS (SELECT 1 FROM activity x WHERE x."userId" = u.id
            AND x.at >= u.signup + interval '7 days' AND x.at < u.signup + interval '14 days') AS week2,
    u.signup <= now() - interval '14 days' AS week2_closed,
    EXISTS (SELECT 1 FROM activity x WHERE x."userId" = u.id AND x.at >= now() - interval '7 days') AS active7
  FROM users u
)
SELECT
  to_char(cohort, 'YYYY-MM-DD') AS semana,
  count(*)::int AS cadastros,
  count(*) FILTER (WHERE enrolled)::int AS escolheram_prova,
  count(*) FILTER (WHERE diagnosed)::int AS diagnostico_ok,
  count(*) FILTER (WHERE practiced)::int AS praticaram,
  count(*) FILTER (WHERE week2_closed)::int AS janela_s2_fechada,
  count(*) FILTER (WHERE week2_closed AND week2)::int AS voltaram_s2,
  count(*) FILTER (WHERE active7)::int AS ativos_7d
FROM per_user
GROUP BY cohort
ORDER BY cohort
`

// Cadastros por origem (ref > utm_source > domínio de referência > direto).
const SOURCE_SQL = `
WITH params AS (SELECT date_trunc('week', now()) - ($1::int - 1) * interval '1 week' AS since)
SELECT
  coalesce(u."signupSource" ->> 'ref', u."signupSource" ->> 'utmSource', u."signupSource" ->> 'referrer', 'direto/desconhecido') AS origem,
  count(*)::int AS cadastros,
  count(*) FILTER (WHERE EXISTS (SELECT 1 FROM "Enrollment" e WHERE e."userId" = u.id AND e.diagnostic ->> 'finishedAt' IS NOT NULL))::int AS diagnostico_ok,
  count(*) FILTER (WHERE EXISTS (SELECT 1 FROM "UserAnswer" a WHERE a."userId" = u.id))::int AS praticaram,
  count(*) FILTER (WHERE u.plan = 'PLUS')::int AS plus
FROM "User" u, params
WHERE u."createdAt" >= params.since
  AND NOT (lower(split_part(u.email, '@', 2)) = ANY($2::text[]))
  AND NOT (lower(u.email) ~ $3)
GROUP BY 1
ORDER BY 2 DESC
`

const pct = (part, whole) => (whole ? `${Math.round((100 * part) / whole)}%` : '—')

let bySource = []
try {
  const rows = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe('SET TRANSACTION READ ONLY')
    return [await tx.$queryRawUnsafe(SQL, weeks, excluded, TEST_PATTERN), await tx.$queryRawUnsafe(SOURCE_SQL, weeks, excluded, TEST_PATTERN)]
  }).then(([funnel, sources]) => { bySource = sources; return funnel })
  const total = rows.reduce((acc, r) => {
    for (const key of Object.keys(r)) if (key !== 'semana') acc[key] = (acc[key] ?? 0) + r[key]
    return acc
  }, {})
  console.log(`Funil das últimas ${weeks} semanas (cadastro por semana, segunda-feira UTC)` +
    (excluded.length ? `; excluindo domínios: ${excluded.join(', ')}` : '') +
    (args.includes('--include-test') ? '; incluindo contas de teste' : '; sem contas de teste'))
  console.table(rows.map((r) => ({
    semana: r.semana,
    cadastros: r.cadastros,
    'escolheu prova': `${r.escolheram_prova} (${pct(r.escolheram_prova, r.cadastros)})`,
    'diagnóstico': `${r.diagnostico_ok} (${pct(r.diagnostico_ok, r.cadastros)})`,
    'praticou': `${r.praticaram} (${pct(r.praticaram, r.cadastros)})`,
    'voltou na S2': r.janela_s2_fechada ? `${r.voltaram_s2}/${r.janela_s2_fechada} (${pct(r.voltaram_s2, r.janela_s2_fechada)})` : 'janela aberta',
    'ativos 7d': r.ativos_7d,
  })))
  if (rows.length) {
    console.log(`Total: ${total.cadastros} cadastros · diagnóstico ${pct(total.diagnostico_ok, total.cadastros)} · ` +
      `praticou ${pct(total.praticaram, total.cadastros)} · voltou na S2 ${pct(total.voltaram_s2, total.janela_s2_fechada)} ` +
      `(${total.voltaram_s2}/${total.janela_s2_fechada}) · ativos 7d ${total.ativos_7d}`)
  }
  console.log('Cadastros por origem (?ref, utm_source ou site de referência):')
  console.table(bySource.map((r) => ({ origem: r.origem, cadastros: r.cadastros,
    'diagnóstico': `${r.diagnostico_ok} (${pct(r.diagnostico_ok, r.cadastros)})`,
    praticou: `${r.praticaram} (${pct(r.praticaram, r.cadastros)})`, plus: r.plus })))
} finally {
  await prisma.$disconnect()
}
