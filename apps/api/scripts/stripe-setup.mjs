// Cria (ou reaproveita) na Stripe o produto Kuaa Plus, os preços mensais e o
// portal de assinatura. Idempotente (procura pelos lookup_keys antes de criar).
//   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup.mjs
// Rode primeiro com a chave de TESTE; repita com a chave live no lançamento.
import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY
if (!key) { console.error('Defina STRIPE_SECRET_KEY.'); process.exit(1) }
const stripe = new Stripe(key)
const mode = key.startsWith('sk_live_') ? 'LIVE' : 'teste'
const PRICES = [
  { lookup: process.env.STRIPE_PRICE_FULL_LOOKUP || 'kuaa_plus_mensal', amount: 2990, nickname: 'Mensal' },
  { lookup: process.env.STRIPE_PRICE_STUDENT_LOOKUP || 'kuaa_plus_mensal_estudante', amount: 1495, nickname: 'Mensal estudante (meia)' },
]

const existing = await stripe.prices.list({ lookup_keys: PRICES.map((p) => p.lookup), expand: ['data.product'], limit: 10 })
let productId = existing.data[0]?.product?.id
if (!productId) {
  const product = await stripe.products.create({
    name: 'Kuaa Plus',
    description: 'Mais práticas, Sabiá e análises de redação no Kuaa. Assinatura mensal; cancele quando quiser.',
    metadata: { plan: 'PLUS' },
  })
  productId = product.id
  console.log(`[${mode}] Produto criado: ${productId}`)
}
for (const p of PRICES) {
  const found = existing.data.find((x) => x.lookup_key === p.lookup)
  if (found) { console.log(`[${mode}] Preço já existe: ${p.lookup} = ${found.id} (R$ ${found.unit_amount / 100}/mês)`); continue }
  const price = await stripe.prices.create({ product: productId, currency: 'brl', unit_amount: p.amount, nickname: p.nickname,
    recurring: { interval: 'month' }, lookup_key: p.lookup, metadata: { plan: 'PLUS' } })
  console.log(`[${mode}] Preço criado: ${p.lookup} = ${price.id} (R$ ${p.amount / 100}/mês)`)
}

const portals = await stripe.billingPortal.configurations.list({ is_default: true, limit: 1 })
if (portals.data.length) console.log(`[${mode}] Portal de assinatura já configurado: ${portals.data[0].id}`)
else {
  const portal = await stripe.billingPortal.configurations.create({
    business_profile: { headline: 'Kuaa — sua assinatura' },
    features: {
      subscription_cancel: { enabled: true, mode: 'at_period_end' },
      payment_method_update: { enabled: true },
      invoice_history: { enabled: true },
    },
  })
  console.log(`[${mode}] Portal de assinatura criado: ${portal.id}`)
}
