import Stripe from 'stripe'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'
import { env } from '../lib/env'
import { setStripeClient } from '../modules/billing/billing'
import { RENEWAL_GRACE_MS } from '../modules/plans/coverage'

const WEBHOOK_SECRET = 'whsec_test_only_not_real'
const real = new Stripe('sk_test_dummy_not_used_for_network')
const sessions: Array<Record<string, unknown>> = []
const subs = new Map<string, Record<string, unknown>>()
let customerSeq = 0

// Cliente falso: nenhum teste chama a rede da Stripe. A assinatura do webhook
// usa o verificador real do SDK.
const fake = {
  webhooks: real.webhooks,
  prices: { list: async ({ lookup_keys }: { lookup_keys: string[] }) => ({
    data: [lookup_keys[0] === 'kuaa_plus_mensal_estudante' ? { id: 'price_student', unit_amount: 1495 } : { id: 'price_full', unit_amount: 2990 }],
  }) },
  customers: { create: async () => ({ id: `cus_test_${++customerSeq}` }) },
  checkout: { sessions: { create: async (params: Record<string, unknown>) => { sessions.push(params); return { id: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/cs_test_1' } } } },
  subscriptions: { retrieve: async (id: string) => subs.get(id) },
  billingPortal: { sessions: { create: async () => ({ url: 'https://billing.stripe.com/p/session/test' }) } },
} as unknown as Stripe

beforeAll(() => {
  Object.assign(env, { STRIPE_SECRET_KEY: 'sk_test_dummy', STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET })
  setStripeClient(fake)
})
afterAll(() => {
  Object.assign(env, { STRIPE_SECRET_KEY: undefined, STRIPE_WEBHOOK_SECRET: undefined })
  setStripeClient(null)
})
beforeEach(async () => { await truncateUserData(); sessions.length = 0; subs.clear() })

function sendEvent(type: string, object: Record<string, unknown>, secret = WEBHOOK_SECRET) {
  const payload = JSON.stringify({ id: `evt_${Math.random().toString(36).slice(2)}`, object: 'event', type, data: { object } })
  const signature = real.webhooks.generateTestHeaderString({ payload, secret })
  return api.post('/api/v1/billing/webhook').set('Content-Type', 'application/json').set('Stripe-Signature', signature).send(payload)
}
function subscription(id: string, userId: string, status: string, periodEnd: Date, extra: Record<string, unknown> = {}) {
  const sub = { id, object: 'subscription', customer: 'cus_x', status, cancel_at_period_end: false,
    metadata: { userId, priceKind: 'FULL' }, items: { data: [{ current_period_end: Math.floor(periodEnd.getTime() / 1000) }] }, ...extra }
  subs.set(id, sub)
  return sub
}
const plan = (userId: string) => testPrisma.user.findUniqueOrThrow({ where: { id: userId }, select: { plan: true, planExpiresAt: true } })
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000)

describe('assinatura mensal do Kuaa Plus (Stripe Billing)', () => {
  it('config pública mostra os dois preços', async () => {
    expect((await api.get('/api/v1/billing/config')).body).toEqual({ enabled: true, prices: { full: 2990, student: 1495 } })
  })

  it('checkout exige login e confirmação de maioridade/responsável', async () => {
    expect((await api.post('/api/v1/billing/checkout').send({ adultConfirmed: true })).status).toBe(401)
    const account = await registerAndLogin('sub_adult')
    expect((await api.post('/api/v1/billing/checkout').set('Authorization', `Bearer ${account.token}`).send({})).status).toBe(400)
  })

  it('cria assinatura mensal com Pix Automático configurado e preço cheio para quem não é estudante aprovado', async () => {
    const account = await registerAndLogin('sub_full')
    const res = await api.post('/api/v1/billing/checkout').set('Authorization', `Bearer ${account.token}`).send({ adultConfirmed: true })
    expect(res.status).toBe(200)
    expect(res.body.priceKind).toBe('FULL')
    expect(sessions[0]).toMatchObject({ mode: 'subscription', client_reference_id: account.userId, line_items: [{ price: 'price_full', quantity: 1 }],
      payment_method_options: { pix: { mandate_options: { amount: 2990, payment_schedule: 'monthly' } } },
      subscription_data: { metadata: { userId: account.userId, priceKind: 'FULL' } } })
    expect(sessions[0]).not.toHaveProperty('payment_method_types')
    const user = await testPrisma.user.findUniqueOrThrow({ where: { id: account.userId } })
    expect(user.stripeCustomerId).toBe(sessions[0].customer)
  })

  it('estudante aprovado recebe o preço de meia', async () => {
    const account = await registerAndLogin('sub_student')
    await testPrisma.studentVerification.create({ data: { userId: account.userId, status: 'APPROVED', expiresAt: inDays(300) } })
    const res = await api.post('/api/v1/billing/checkout').set('Authorization', `Bearer ${account.token}`).send({ adultConfirmed: true })
    expect(res.body.priceKind).toBe('STUDENT')
    expect(sessions[0]).toMatchObject({ line_items: [{ price: 'price_student', quantity: 1 }] })
  })

  it('webhook com assinatura inválida é recusado', async () => {
    const account = await registerAndLogin('sub_badsig')
    subscription('sub_1', account.userId, 'active', inDays(30))
    expect((await sendEvent('customer.subscription.updated', { id: 'sub_1', object: 'subscription' }, 'whsec_wrong')).status).toBe(400)
    expect((await plan(account.userId)).plan).toBe('FREE')
  })

  it('assinatura ativa libera o Plus até o fim do período + folga do Pix; repetir o evento não muda nada', async () => {
    const account = await registerAndLogin('sub_active')
    const end = inDays(30)
    subscription('sub_1', account.userId, 'active', end)
    await sendEvent('checkout.session.completed', { id: 'cs_1', object: 'checkout.session', subscription: 'sub_1' })
    const after = await plan(account.userId)
    expect(after.plan).toBe('PLUS')
    expect(Math.abs(after.planExpiresAt!.getTime() - (end.getTime() + RENEWAL_GRACE_MS))).toBeLessThan(1000)
    await sendEvent('customer.subscription.updated', { id: 'sub_1', object: 'subscription' })
    expect(await testPrisma.subscription.count()).toBe(1)
    const again = await api.post('/api/v1/billing/checkout').set('Authorization', `Bearer ${account.token}`).send({ adultConfirmed: true })
    expect(again.status).toBe(409)
  })

  it('renovação paga estende; pagamento pendente (past_due) mantém; cancelada volta a FREE', async () => {
    const account = await registerAndLogin('sub_cycle')
    subscription('sub_2', account.userId, 'active', inDays(30))
    await sendEvent('customer.subscription.created', { id: 'sub_2', object: 'subscription' })
    subscription('sub_2', account.userId, 'active', inDays(60))
    await sendEvent('invoice.paid', { id: 'in_1', object: 'invoice', parent: { subscription_details: { subscription: 'sub_2' } } })
    expect((await plan(account.userId)).planExpiresAt!.getTime()).toBeGreaterThan(inDays(60).getTime())
    subscription('sub_2', account.userId, 'past_due', inDays(1))
    await sendEvent('invoice.payment_failed', { id: 'in_2', object: 'invoice', subscription: 'sub_2' })
    expect((await plan(account.userId)).plan).toBe('PLUS')
    subscription('sub_2', account.userId, 'canceled', inDays(-1))
    await sendEvent('customer.subscription.deleted', { id: 'sub_2', object: 'subscription' })
    expect(await plan(account.userId)).toEqual({ plan: 'FREE', planExpiresAt: null })
  })

  it('cancelar no fim do período mantém o Plus até lá e registra o aviso', async () => {
    const account = await registerAndLogin('sub_cancel_end')
    subscription('sub_3', account.userId, 'active', inDays(10), { cancel_at_period_end: true })
    await sendEvent('customer.subscription.updated', { id: 'sub_3', object: 'subscription' })
    expect((await plan(account.userId)).plan).toBe('PLUS')
    const mine = await api.get('/api/v1/billing/subscription').set('Authorization', `Bearer ${account.token}`)
    expect(mine.body).toMatchObject({ status: 'active', cancelAtPeriodEnd: true, priceKind: 'FULL' })
  })

  it('liberação manual (grant-plus) não é derrubada por uma assinatura cancelada', async () => {
    const account = await registerAndLogin('sub_manual')
    await testPrisma.planGrant.create({ data: { userId: account.userId, plan: 'PLUS', expiresAt: inDays(90), source: 'manual-pix', reference: 'r1' } })
    subscription('sub_4', account.userId, 'canceled', inDays(-1))
    await sendEvent('customer.subscription.deleted', { id: 'sub_4', object: 'subscription' })
    expect((await plan(account.userId)).plan).toBe('PLUS')
  })

  it('portal de assinatura só para quem já é cliente', async () => {
    const account = await registerAndLogin('sub_portal')
    expect((await api.post('/api/v1/billing/portal').set('Authorization', `Bearer ${account.token}`)).status).toBe(404)
    await api.post('/api/v1/billing/checkout').set('Authorization', `Bearer ${account.token}`).send({ adultConfirmed: true })
    const res = await api.post('/api/v1/billing/portal').set('Authorization', `Bearer ${account.token}`)
    expect(res.body.url).toMatch(/^https:\/\/billing\.stripe\.com\//)
  })
})
