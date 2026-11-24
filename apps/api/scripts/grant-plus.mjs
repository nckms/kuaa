// Libera o Kuaa Plus para uma conta depois de um pagamento confirmado.
//
//   npm run grant-plus --workspace=apps/api -- --email aluno@exemplo.com --until 2027-12-31 --ref <id do pagamento>
//
// - Exige --ref (id do pagamento no provedor): o mesmo pagamento não libera duas vezes.
// - Nunca reduz uma validade maior já existente.
// - Escreve uma linha em PlanGrant (auditoria) e atualiza o usuário na mesma transação.
// - Mostra o e-mail mascarado; sem --yes só simula.
import { PrismaClient } from '@prisma/client'

const args = process.argv.slice(2)
const arg = (name) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined }
const email = arg('email')?.trim().toLowerCase()
const until = arg('until')
const reference = arg('ref')?.trim()
const source = arg('source') ?? 'manual-pix'
const confirm = args.includes('--yes')

if (!email || !until || !reference) {
  console.error('Uso: --email <e-mail> --until AAAA-MM-DD --ref <id do pagamento> [--source manual-pix] [--yes]')
  process.exit(1)
}
const expiresAt = new Date(`${until}T23:59:59-03:00`)
if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
  console.error('Data --until inválida ou no passado.')
  process.exit(1)
}
const brDate = (d) => new Date(d.getTime() - 3 * 3600_000).toISOString().slice(0, 10)
const mask = (value) => value.replace(/^(.{2}).*(@.*)$/, '$1***$2')
const prisma = new PrismaClient()
try {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, plan: true, planExpiresAt: true } })
  if (!user) { console.error(`Conta não encontrada: ${mask(email)}`); process.exit(1) }
  const already = await prisma.planGrant.findUnique({ where: { source_reference: { source, reference } } })
  if (already) { console.log('Este pagamento já foi usado para liberar um plano. Nada alterado.'); process.exit(0) }
  const finalExpiry = user.plan === 'PLUS' && user.planExpiresAt && user.planExpiresAt > expiresAt ? user.planExpiresAt : expiresAt
  console.log(`${confirm ? 'Liberando' : '[simulação]'} Plus para ${mask(email)} até ${brDate(finalExpiry)} (ref ${reference}, ${source})`)
  if (!confirm) { console.log('Nada foi gravado. Repita com --yes para confirmar.'); process.exit(0) }
  await prisma.$transaction([
    prisma.planGrant.create({ data: { userId: user.id, plan: 'PLUS', expiresAt: finalExpiry, source, reference } }),
    prisma.user.update({ where: { id: user.id }, data: { plan: 'PLUS', planExpiresAt: finalExpiry } }),
  ])
  console.log('Pronto. O aluno vê o Plus no próximo carregamento do site.')
} finally {
  await prisma.$disconnect()
}
