// Cria (ou reaproveita) o produto e o preço do Kuaa Plus na Stripe.
// Idempotente: procura o preço pelo lookup_key antes de criar.
//   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup.mjs
// Use primeiro com chave de TESTE; repita com a chave live só no lançamento.
import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY
if (!key) { console.error('Defina STRIPE_SECRET_KEY.'); process.exit(1) }
const LOOKUP_KEY = process.env.STRIPE_PLUS_LOOKUP_KEY || 'kuaa_plus_enem_2027'
const AMOUNT = Number(process.env.STRIPE_PLUS_AMOUNT || 9900) // centavos
const stripe = new Stripe(key)
const mode = key.startsWith('sk_live_') ? 'LIVE' : 'teste'

const existing = await stripe.prices.list({ lookup_keys: [LOOKUP_KEY], expand: ['data.product'] })
if (existing.data.length) {
  const price = existing.data[0]
  console.log(`[${mode}] Preço já existe: ${price.id} (${price.unit_amount / 100} ${price.currency.toUpperCase()}), produto ${price.product.id}`)
  process.exit(0)
}
const product = await stripe.products.create({
  name: 'Kuaa Plus — até o ENEM 2027',
  description: 'Mais práticas, Sabiá e análises de redação no Kuaa. Acesso até 31/12/2027. Pagamento único, sem renovação automática.',
  metadata: { plan: 'PLUS', expires_at: '2027-12-31' },
})
const price = await stripe.prices.create({
  product: product.id, currency: 'brl', unit_amount: AMOUNT, lookup_key: LOOKUP_KEY,
  metadata: { plan: 'PLUS', expires_at: '2027-12-31' },
})
console.log(`[${mode}] Criado produto ${product.id} e preço ${price.id} (R$ ${AMOUNT / 100}) com lookup_key ${LOOKUP_KEY}`)
