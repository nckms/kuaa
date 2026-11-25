// Resumo mensal para os responsáveis (normalmente enviado sozinho no dia 1 pelo servidor).
//   npm run guardian-report --workspace=apps/api            -> só conta (simulação)
//   npm run guardian-report --workspace=apps/api -- --send  -> envia o mês anterior
// Idempotente por mês. Saída só agregada; nenhum e-mail aparece no terminal.
import 'dotenv/config'
import { runGuardianReports } from '../src/modules/engagement/guardian'
import { prisma } from '../src/lib/prisma'
import { redis } from '../src/lib/redis'

async function main() {
  const send = process.argv.includes('--send')
  const result = await runGuardianReports({ dryRun: !send })
  console.log(`${send ? 'Envio' : 'Simulação'}: ${result.eligible} aptos · ${result.sent} enviados · ` +
    `${result.skippedAlreadySent} já receberam neste mês · ${result.failed} falhas`)
}
main().finally(async () => { await prisma.$disconnect(); redis.disconnect() })
