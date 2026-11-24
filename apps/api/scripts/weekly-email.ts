// E-mail semanal de "próximo passo".
//   npm run weekly-email --workspace=apps/api            -> só conta (simulação)
//   npm run weekly-email --workspace=apps/api -- --send  -> envia
// Idempotente por semana: rodar de novo na mesma semana não reenvia.
// Saída só agregada; nenhum e-mail aparece no terminal.
import 'dotenv/config'
import { runWeeklyEmails } from '../src/modules/engagement/weeklyEmail'
import { prisma } from '../src/lib/prisma'
import { redis } from '../src/lib/redis'

async function main() {
  const send = process.argv.includes('--send')
  const result = await runWeeklyEmails({ dryRun: !send })
  console.log(`${send ? 'Envio' : 'Simulação'}: ${result.eligible} aptos · ${result.sent} enviados · ` +
    `${result.skippedAlreadySent} já receberam nesta semana · ${result.failed} falhas`)
}
main().finally(async () => { await prisma.$disconnect(); redis.disconnect() })
