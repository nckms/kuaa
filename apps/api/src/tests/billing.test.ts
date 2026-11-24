import Stripe from 'stripe'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'
import { env } from '../lib/env'
import { setStripeClient } from '../modules/billing/billing'

const WEBHOOK_SECRET = 'whsec_test_only_not_real'
const real = new Stripe('sk_test_dummy_not_used_for_network')
const created: Array<Record<string, unknown>> = []

// Cliente falso: nenhum teste chama a rede da Stripe. A assinatura do webhook
// usa o verificador real do SDK.
const fake = {
  webhooks: real.webhooks,
  prices: { list: async () => ({ data: [{ id: 'price_test_plus' }] }) },
  checkout: { sessions: { create: async (params: Record<string, unknown>) => { created.push(params); return { id: 'cs_test_1', url: 'https://checkout.stripe.com/c/pay/cs_test_1' } } } },
} as unknown as Stripe

beforeAll(() => {
  Object.assign(env, { STRIPE_SECRET_KEY: 'sk_test_dummy', STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET, PLUS_EXPIRES_AT: '2027-12-31' })
  setStripeClient(fake)
})
afterAll(() => {
  Object.assign(env, { STRIPE_SECRET_KEY: undefined, STRIPE_WEBHOOK_SECRET: undefined })
  setStripeClient(null)
})
beforeEach(async () => { await truncateUserData(); created.length = 0 })

function sendEvent(type: string, object: Record<string, unknown>, secret = WEBHOOK_SECRET) {
  const payload = JSON.stringify({ id: `evt_${Math.random().toString(36).slice(2)}`, object: 'event', type, data: { object } })
  const signature = real.webhooks.generateTestHeaderString({ payload, secret })
  return api.post('/api/v1/billing/webhook').set('Content-Type', 'application/json').set('Stripe-Signature', signature).send(payload)
}
const session = (userId: string, extra: Record<string, unknown> = {}) => ({
  id: 'cs_test_1', object: 'checkout.session', client_reference_id: userId, payment_intent: 'pi_test_1',
  payment_status: 'paid', metadata: { kind: 'kuaa_plus', userId }, ...extra,
})
const plan = (userId: string) => testPrisma.user.findUniqueOrThrow({ where: { id: userId }, select: { plan: true, planExpiresAt: true } })

describe('pagamento do Kuaa Plus (Stripe Checkout)', () => {
  it('config pública indica venda ligada', async () => {
    expect((await api.get('/api/v1/billing/config')).body).toEqual({ enabled: true, plusExpiresAt: '2027-12-31' })
  })

  it('checkout exige login e confirmação de maioridade/responsável', async () => {
    expect((await api.post('/api/v1/billing/checkout').send({ adultConfirmed: true })).status).toBe(401)
    const account = await registerAndLogin('checkout_adult')
    expect((await api.post('/api/v1/billing/checkout').set('Authorization', `Bearer ${account.token}`).send({})).status).toBe(400)
  })

  it('cria sessão hospedada com o aluno como referência e sem fixar métodos de pagamento', async () => {
    const account = await registerAndLogin('checkout_ok')
    const res = await api.post('/api/v1/billing/checkout').set('Authorization', `Bearer ${account.token}`).send({ adultConfirmed: true })
    expect(res.status).toBe(200)
    expect(res.body.url).toMatch(/^https:\/\/checkout\.stripe\.com\//)
    expect(created[0]).toMatchObject({ mode: 'payment', client_reference_id: account.userId, customer_email: account.email,
      line_items: [{ price: 'price_test_plus', quantity: 1 }], metadata: { kind: 'kuaa_plus', userId: account.userId } })
    expect(created[0]).not.toHaveProperty('payment_method_types')
  })

  it('webhook com assinatura inválida é recusado e não libera nada', async () => {
    const account = await registerAndLogin('hook_bad')
    const res = await sendEvent('checkout.session.completed', session(account.userId), 'whsec_wrong')
    expect(res.status).toBe(400)
    expect((await plan(account.userId)).plan).toBe('FREE')
  })

  it('cartão: checkout.session.completed pago libera o Plus até 31/12/2027; reenvio do evento não duplica', async () => {
    const account = await registerAndLogin('hook_card')
    expect((await sendEvent('checkout.session.completed', session(account.userId))).status).toBe(200)
    const after = await plan(account.userId)
    expect(after.plan).toBe('PLUS')
    expect(after.planExpiresAt?.toISOString()).toBe('2028-01-01T02:59:59.000Z')
    expect((await sendEvent('checkout.session.completed', session(account.userId))).status).toBe(200)
    expect(await testPrisma.planGrant.count({ where: { userId: account.userId } })).toBe(1)
    const again = await api.post('/api/v1/billing/checkout').set('Authorization', `Bearer ${account.token}`).send({ adultConfirmed: true })
    expect(again.status).toBe(409)
  })

  it('Pix: completed chega sem pagamento e só libera em async_payment_succeeded', async () => {
    const account = await registerAndLogin('hook_pix')
    await sendEvent('checkout.session.completed', session(account.userId, { payment_status: 'unpaid' }))
    expect((await plan(account.userId)).plan).toBe('FREE')
    await sendEvent('checkout.session.async_payment_succeeded', session(account.userId))
    expect((await plan(account.userId)).plan).toBe('PLUS')
  })

  it('reembolso total revoga o Plus daquela compra', async () => {
    const account = await registerAndLogin('hook_refund')
    await sendEvent('checkout.session.completed', session(account.userId))
    await sendEvent('charge.refunded', { id: 'ch_1', object: 'charge', payment_intent: 'pi_test_1', refunded: true })
    expect(await plan(account.userId)).toEqual({ plan: 'FREE', planExpiresAt: null })
    // Evento repetido não quebra nem cria nova revogação.
    expect((await sendEvent('charge.refunded', { id: 'ch_1', object: 'charge', payment_intent: 'pi_test_1', refunded: true })).status).toBe(200)
  })

  it('sessão de outro produto ou de usuário inexistente é ignorada', async () => {
    const account = await registerAndLogin('hook_other')
    await sendEvent('checkout.session.completed', session(account.userId, { metadata: { kind: 'outra_coisa' } }))
    await sendEvent('checkout.session.completed', session('usuario_inexistente', { payment_intent: 'pi_2' }))
    expect((await plan(account.userId)).plan).toBe('FREE')
    expect(await testPrisma.planGrant.count()).toBe(0)
  })
})
