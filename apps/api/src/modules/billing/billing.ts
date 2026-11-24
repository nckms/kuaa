import type { Request, Response, NextFunction } from 'express'
import Stripe from 'stripe'
import { z } from 'zod'
import { env } from '../../lib/env'
import { prisma } from '../../lib/prisma'
import { makeError } from '../../utils/errors'
import { effectivePlan } from '../plans/entitlements'
import { endOfDayBrt, grantPlus, revokeGrant } from '../plans/grant'

export const STRIPE_SOURCE = 'stripe'
const PRODUCT_KIND = 'kuaa_plus'

let client: Stripe | null = null
export function stripeClient(): Stripe {
  if (!env.STRIPE_SECRET_KEY) throw makeError('Pagamentos indisponíveis no momento.', 503, 'BILLING_UNAVAILABLE')
  client ??= new Stripe(env.STRIPE_SECRET_KEY)
  return client
}
/** Permite trocar o cliente nos testes. */
export function setStripeClient(value: Stripe | null) { client = value; priceId = null }

let priceId: string | null = null
async function plusPriceId(stripe: Stripe): Promise<string> {
  if (priceId) return priceId
  const prices = await stripe.prices.list({ lookup_keys: [env.STRIPE_PLUS_LOOKUP_KEY], active: true, limit: 1 })
  const found = prices.data[0]
  if (!found) throw makeError('Plano indisponível no momento.', 503, 'BILLING_UNAVAILABLE')
  priceId = found.id
  return priceId
}

const appUrl = () => (env.APP_URL ?? 'http://localhost:5173').replace(/\/$/, '')

export function billingConfig(_req: Request, res: Response) {
  res.json({ enabled: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET), plusExpiresAt: env.PLUS_EXPIRES_AT })
}

/** Cria a sessão do Stripe Checkout (cartão e Pix) para o aluno logado. */
export async function createCheckout(req: Request, res: Response, next: NextFunction) {
  try {
    z.object({ adultConfirmed: z.literal(true) }).strict().parse(req.body)
    if (env.NODE_ENV === 'production' && !env.APP_URL) throw makeError('Pagamentos indisponíveis no momento.', 503, 'BILLING_UNAVAILABLE')
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! }, select: { id: true, email: true, plan: true, planExpiresAt: true } })
    const target = endOfDayBrt(env.PLUS_EXPIRES_AT)
    if (effectivePlan(user) === 'PLUS' && (!user.planExpiresAt || user.planExpiresAt >= target)) {
      throw makeError('Seu Kuaa Plus já está ativo.', 409, 'ALREADY_PLUS')
    }
    const stripe = stripeClient()
    const metadata = { kind: PRODUCT_KIND, userId: user.id, adultConfirmed: 'true' }
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: await plusPriceId(stripe), quantity: 1 }],
      client_reference_id: user.id,
      customer_email: user.email,
      locale: 'pt-BR',
      metadata,
      payment_intent_data: { metadata },
      success_url: `${appUrl()}/planos?compra=ok`,
      cancel_url: `${appUrl()}/planos?compra=cancelada`,
    }, { idempotencyKey: `checkout:${user.id}:${Math.floor(Date.now() / 60_000)}` })
    if (!session.url) throw makeError('Não foi possível abrir o pagamento.', 502, 'CHECKOUT_FAILED')
    res.json({ url: session.url })
  } catch (err) { next(err) }
}

async function handleSession(session: Stripe.Checkout.Session) {
  if (session.metadata?.kind !== PRODUCT_KIND || session.payment_status !== 'paid') return
  const userId = session.client_reference_id ?? session.metadata?.userId
  const reference = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
  if (!userId || !reference) return
  const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!exists) return
  await grantPlus(userId, endOfDayBrt(env.PLUS_EXPIRES_AT), STRIPE_SOURCE, reference)
}

/**
 * Webhook da Stripe. Precisa do corpo cru (montado antes do express.json).
 * Cartão: checkout.session.completed já vem pago. Pix: completed chega
 * "unpaid" e a liberação acontece em async_payment_succeeded.
 */
export async function stripeWebhook(req: Request, res: Response) {
  const signature = req.get('stripe-signature')
  if (!env.STRIPE_WEBHOOK_SECRET || !signature || !Buffer.isBuffer(req.body)) { res.status(400).json({ error: 'Assinatura ausente' }); return }
  let event: Stripe.Event
  try {
    event = stripeClient().webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET)
  } catch {
    res.status(400).json({ error: 'Assinatura inválida' })
    return
  }
  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await handleSession(event.data.object)
        break
      case 'charge.refunded': {
        const charge = event.data.object
        const reference = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id
        if (charge.refunded && reference) await revokeGrant(STRIPE_SOURCE, reference, `${STRIPE_SOURCE}-refund`)
        break
      }
      default:
        break
    }
    res.json({ received: true })
  } catch {
    // 500 faz a Stripe reenviar o evento mais tarde.
    console.error(JSON.stringify({ event: 'stripe_webhook_failed', type: event.type, id: event.id }))
    res.status(500).json({ error: 'Falha ao processar' })
  }
}
