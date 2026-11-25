import Stripe from 'stripe'
import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'
import { env } from '../lib/env'
import { setStripeClient } from '../modules/billing/billing'

const canceled: string[] = []
let failCancel = false
const fakeStripe = { subscriptions: { cancel: async (id: string) => {
  if (failCancel) throw Object.assign(new Error('network'), { code: 'api_connection_error' })
  canceled.push(id); return { id, status: 'canceled' }
} } } as unknown as Stripe

beforeEach(async () => { await truncateUserData(); canceled.length = 0; failCancel = false })
afterAll(() => { setStripeClient(null); env.STRIPE_SECRET_KEY = undefined })

async function studentWithHistory(suffix: string) {
  const account = await registerAndLogin(suffix)
  await testPrisma.user.update({ where: { id: account.userId }, data: { signupSource: { ref: 'prof.ana' } } })
  const exam = await testPrisma.vestibular.findUniqueOrThrow({ where: { slug: 'enem' } })
  await api.post('/api/v1/enrollments').set('Authorization', `Bearer ${account.token}`).send({ vestibularId: exam.id })
  const topic = await testPrisma.topic.findFirstOrThrow({ where: { subject: { vestibularId: exam.id } } })
  const session = await testPrisma.quizSession.create({ data: { userId: account.userId, topicId: topic.id } })
  const question = await testPrisma.question.create({ data: { topicId: topic.id, generatedForSessionId: session.id, body: 'Quanto é 2+2?',
    options: [{ id: 'A', text: '4', isCorrect: true }, { id: 'B', text: '5', isCorrect: false }], explanation: 'Soma simples.', difficulty: 1, source: 'AI_GENERATED' } })
  await testPrisma.userAnswer.create({ data: { userId: account.userId, sessionId: session.id, questionId: question.id, optionId: 'A', isCorrect: true, timeSpentMs: 1000 } })
  await testPrisma.userTopicProgress.upsert({ where: { userId_topicId: { userId: account.userId, topicId: topic.id } }, update: {}, create: { userId: account.userId, topicId: topic.id, unlocked: true } })
  await testPrisma.sabiaMessage.create({ data: { userId: account.userId, role: 'user', content: 'O que é mitose?' } })
  return { ...account, questionId: question.id }
}

describe('LGPD: exportar e excluir a própria conta', () => {
  it('exporta os dados do próprio aluno, sem senha', async () => {
    const s = await studentWithHistory('export_me')
    const res = await api.get('/api/v1/users/me/export').set('Authorization', `Bearer ${s.token}`)
    expect(res.status).toBe(200)
    expect(res.headers['content-disposition']).toMatch(/attachment; filename="kuaa-meus-dados-/)
    const data = JSON.parse(res.text)
    expect(data.user).toMatchObject({ email: s.email, signupSource: { ref: 'prof.ana' } })
    expect(res.text).not.toContain('passwordHash')
    expect(data.sessions[0].answers[0]).toMatchObject({ optionId: 'A', isCorrect: true, question: { body: 'Quanto é 2+2?' } })
    expect(data.sabia[0].content).toBe('O que é mitose?')
    expect((await api.get('/api/v1/users/me/export')).status).toBe(401)
  })

  it('exige senha e a palavra EXCLUIR; senha errada não apaga nada', async () => {
    const s = await studentWithHistory('delete_guard')
    expect((await api.delete('/api/v1/users/me').set('Authorization', `Bearer ${s.token}`).send({ password: s.password })).status).toBe(400)
    expect((await api.delete('/api/v1/users/me').set('Authorization', `Bearer ${s.token}`).send({ password: 'errada123', confirm: 'EXCLUIR' })).status).toBe(403)
    expect(await testPrisma.user.count({ where: { id: s.userId } })).toBe(1)
  })

  it('apaga a conta e tudo que é dela, inclusive as questões geradas para as sessões', async () => {
    const s = await studentWithHistory('delete_ok')
    const other = await studentWithHistory('delete_other')
    const res = await api.delete('/api/v1/users/me').set('Authorization', `Bearer ${s.token}`).send({ password: s.password, confirm: 'EXCLUIR' })
    expect(res.status).toBe(204)
    expect(await testPrisma.user.count({ where: { id: s.userId } })).toBe(0)
    for (const model of ['quizSession', 'userAnswer', 'userTopicProgress', 'enrollment', 'sabiaMessage', 'refreshToken'] as const) {
      expect(await (testPrisma[model] as unknown as { count: (a: object) => Promise<number> }).count({ where: { userId: s.userId } })).toBe(0)
    }
    expect(await testPrisma.question.count({ where: { id: s.questionId } })).toBe(0)
    // Outro aluno intacto e a sessão antiga não funciona mais.
    expect(await testPrisma.userAnswer.count({ where: { userId: other.userId } })).toBe(1)
    expect((await api.get('/api/v1/users/me').set('Authorization', `Bearer ${s.token}`)).status).toBe(401)
    expect((await api.post('/api/v1/auth/login').send({ email: s.email, password: s.password })).status).toBe(401)
  })

  it('cancela a assinatura na Stripe antes; se a Stripe falhar, a conta fica', async () => {
    env.STRIPE_SECRET_KEY = 'sk_test_dummy'
    setStripeClient(fakeStripe)
    const s = await studentWithHistory('delete_sub')
    await testPrisma.subscription.create({ data: { userId: s.userId, stripeSubscriptionId: 'sub_live_1', status: 'active', priceKind: 'FULL', currentPeriodEnd: new Date(Date.now() + 86_400_000 * 20) } })
    failCancel = true
    expect((await api.delete('/api/v1/users/me').set('Authorization', `Bearer ${s.token}`).send({ password: s.password, confirm: 'EXCLUIR' })).status).toBe(502)
    expect(await testPrisma.user.count({ where: { id: s.userId } })).toBe(1)
    failCancel = false
    expect((await api.delete('/api/v1/users/me').set('Authorization', `Bearer ${s.token}`).send({ password: s.password, confirm: 'EXCLUIR' })).status).toBe(204)
    expect(canceled).toEqual(['sub_live_1'])
  })
})
