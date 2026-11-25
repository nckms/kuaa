import type { Request, Response, NextFunction } from 'express'
import Stripe from 'stripe'
import { z } from 'zod'
import { env } from '../../lib/env'
import { prisma } from '../../lib/prisma'
import { makeError } from '../../utils/errors'
import { COVERING_STATUSES, recomputePlan } from '../plans/coverage'
import { isStudentEligible } from '../students/students'

let client: Stripe | null = null
export function stripeClient(): Stripe {
  if (!env.STRIPE_SECRET_KEY) throw makeError('Pagamentos indisponíveis no momento.', 503, 'BILLING_UNAVAILABLE')
  client ??= new Stripe(env.STRIPE_SECRET_KEY)
  return client
}
/** Permite trocar o cliente nos testes. */
export function setStripeClient(value: Stripe | null) { client = value; priceCache.clear() }

export type PriceKind = 'FULL' | 'STUDENT'
const priceCache = new Map<PriceKind, { id: string; amount: number }>()
async function price(stripe: Stripe, kind: PriceKind) {
  const cached = priceCache.get(kind)
  if (cached) return cached
  const lookup = kind === 'STUDENT' ? env.STRIPE_PRICE_STUDENT_LOOKUP : env.STRIPE_PRICE_FULL_LOOKUP
  const found = (await stripe.prices.list({ lookup_keys: [lookup], active: true, limit: 1 })).data[0]
  if (!found?.unit_amount) throw makeError('Plano indisponível no momento.', 503, 'BILLING_UNAVAILABLE')
  const value = { id: found.id, amount: found.unit_amount }
  priceCache.set(kind, value)
  return value
}

const appUrl = () => (env.APP_URL ?? 'http://localhost:5173').replace(/\/$/, '')

export async function billingConfig(req: Request, res: Response, next: NextFunction) {
  try {
    const enabled = Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET)
    if (!enabled) { res.json({ enabled: false }); return }
    const stripe = stripeClient()
    const [full, student] = await Promise.all([price(stripe, 'FULL'), price(stripe, 'STUDENT')])
    res.json({ enabled: true, prices: { full: full.amount, student: student.amount } })
  } catch (err) { next(err) }
}

async function customerFor(stripe: Stripe, userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, email: true, name: true, stripeCustomerId: true } })
  if (user.stripeCustomerId) return user.stripeCustomerId
  const customer = await stripe.customers.create({ email: user.email, name: user.name, metadata: { userId: user.id } },
    { idempotencyKey: `customer:${user.id}` })
  await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customer.id } })
  return customer.id
}

/** Assinatura mensal no Checkout hospedado: Pix Automático (sem cartão) ou cartão. */
export async function createCheckout(req: Request, res: Response, next: NextFunction) {
  try {
    z.object({ adultConfirmed: z.literal(true) }).strict().parse(req.body)
    if (env.NODE_ENV === 'production' && !env.APP_URL) throw makeError('Pagamentos indisponíveis no momento.', 503, 'BILLING_UNAVAILABLE')
    const userId = req.userId!
    const current = await prisma.subscription.findFirst({ where: { userId, status: { in: [...COVERING_STATUSES] } } })
    if (current) throw makeError('Você já tem uma assinatura ativa. Gerencie em "Minha assinatura".', 409, 'ALREADY_SUBSCRIBED')
    const stripe = stripeClient()
    const kind: PriceKind = (await isStudentEligible(userId)) ? 'STUDENT' : 'FULL'
    const selected = await price(stripe, kind)
    const metadata = { kind: 'kuaa_plus_subscription', userId, priceKind: kind, adultConfirmed: 'true' }
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: await customerFor(stripe, userId),
      client_reference_id: userId,
      line_items: [{ price: selected.id, quantity: 1 }],
      locale: 'pt-BR',
      metadata,
      subscription_data: { metadata },
      payment_method_options: {
        pix: { mandate_options: { amount: Math.max(env.PIX_MANDATE_MAX_CENTS, selected.amount), payment_schedule: 'monthly' } },
      } as Stripe.Checkout.SessionCreateParams.PaymentMethodOptions,
      success_url: `${appUrl()}/planos?compra=ok`,
      cancel_url: `${appUrl()}/planos?compra=cancelada`,
    }, { idempotencyKey: `checkout:${userId}:${kind}:${Math.floor(Date.now() / 60_000)}` })
    if (!session.url) throw makeError('Não foi possível abrir o pagamento.', 502, 'CHECKOUT_FAILED')
    res.json({ url: session.url, priceKind: kind })
  } catch (err) { next(err) }
}

/** Portal da Stripe para cancelar ou trocar a forma de pagamento. */
export async function createPortal(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! }, select: { stripeCustomerId: true } })
    if (!user.stripeCustomerId) throw makeError('Você ainda não tem assinatura.', 404, 'NO_SUBSCRIPTION')
    const session = await stripeClient().billingPortal.sessions.create({ customer: user.stripeCustomerId, return_url: `${appUrl()}/planos`, locale: 'pt-BR' })
    res.json({ url: session.url })
  } catch (err) { next(err) }
}

export async function mySubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const sub = await prisma.subscription.findFirst({ where: { userId: req.userId! }, orderBy: { updatedAt: 'desc' },
      select: { status: true, priceKind: true, currentPeriodEnd: true, cancelAtPeriodEnd: true } })
    res.json(sub)
  } catch (err) { next(err) }
}

function periodEnd(sub: Stripe.Subscription): Date | null {
  const legacy = (sub as unknown as { current_period_end?: number }).current_period_end
  const fromItem = (sub.items?.data?.[0] as unknown as { current_period_end?: number } | undefined)?.current_period_end
  const seconds = legacy ?? fromItem
  return seconds ? new Date(seconds * 1000) : null
}

/** Grava o estado da assinatura vindo da Stripe e recalcula o plano. Idempotente. */
export async function syncSubscription(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
  const userId = sub.metadata?.userId
    ?? (await prisma.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true } }))?.id
  if (!userId) return
  const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
  if (!exists) return
  const data = {
    status: sub.status,
    priceKind: sub.metadata?.priceKind === 'STUDENT' ? 'STUDENT' : 'FULL',
    currentPeriodEnd: periodEnd(sub),
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
  }
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: sub.id },
    create: { userId, stripeSubscriptionId: sub.id, ...data },
    update: data,
  })
  await recomputePlan(userId)
}

/**
 * Webhook da Stripe (corpo cru, assinatura verificada). A Stripe é a fonte da
 * verdade: em cada evento relevante buscamos a assinatura atual na API, então
 * eventos fora de ordem ou repetidos não deixam estado errado.
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
    const stripe = stripeClient()
    const refresh = async (id: string | null | undefined) => { if (id) await syncSubscription(await stripe.subscriptions.retrieve(id)) }
    const obj = event.data.object as unknown as Record<string, unknown>
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded':
        await refresh(typeof obj.subscription === 'string' ? obj.subscription : (obj.subscription as { id?: string } | null)?.id)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed':
        await refresh(obj.id as string)
        break
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const parent = obj.parent as { subscription_details?: { subscription?: string } } | undefined
        await refresh((obj.subscription as string | undefined) ?? parent?.subscription_details?.subscription)
        break
      }
      default:
        break
    }
    res.json({ received: true })
  } catch {
    console.error(JSON.stringify({ event: 'stripe_webhook_failed', type: event.type, id: event.id }))
    res.status(500).json({ error: 'Falha ao processar' })
  }
}
