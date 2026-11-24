import { beforeEach, describe, expect, it } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'
import { PLAN_LIMITS, effectivePlan, periodStart } from '../modules/plans/entitlements'

beforeEach(async () => { await truncateUserData() })

async function fillPractice(userId: string, count: number) {
  const topic = await testPrisma.topic.findFirstOrThrow()
  await testPrisma.quizSession.createMany({ data: Array.from({ length: count }, () => ({ userId, topicId: topic.id })) })
  return topic.id
}

describe('planos e cotas', () => {
  it('conta nova é FREE e /users/me/plan mostra limites e uso do dia', async () => {
    const account = await registerAndLogin('plan_free')
    const res = await api.get('/api/v1/users/me/plan').set('Authorization', `Bearer ${account.token}`)
    expect(res.status).toBe(200)
    expect(res.body.plan).toBe('FREE')
    const practice = res.body.quotas.find((q: { name: string }) => q.name === 'practice')
    expect(practice).toMatchObject({ limit: PLAN_LIMITS.FREE.practice, used: 0, period: 'day' })
  })

  it('FREE: ao esgotar as práticas do dia, /quiz/generate responde 429 QUOTA_EXCEEDED com caminho para /planos', async () => {
    const account = await registerAndLogin('plan_quota')
    const topicId = await fillPractice(account.userId, PLAN_LIMITS.FREE.practice)
    const res = await api.post('/api/v1/quiz/generate').set('Authorization', `Bearer ${account.token}`).send({ topicId })
    expect(res.status).toBe(429)
    expect(res.body).toMatchObject({ code: 'QUOTA_EXCEEDED', quota: 'practice', plan: 'FREE', upgrade: '/planos' })
  })

  it('PLUS válido passa do limite gratuito; PLUS vencido volta a ser FREE', async () => {
    const account = await registerAndLogin('plan_plus')
    const topicId = await fillPractice(account.userId, PLAN_LIMITS.FREE.practice)
    await testPrisma.user.update({ where: { id: account.userId }, data: { plan: 'PLUS', planExpiresAt: new Date(Date.now() + 86_400_000) } })
    const ok = await api.post('/api/v1/quiz/generate').set('Authorization', `Bearer ${account.token}`).send({ topicId })
    expect(ok.status).not.toBe(429)
    await testPrisma.user.update({ where: { id: account.userId }, data: { planExpiresAt: new Date(Date.now() - 1000) } })
    const summary = await api.get('/api/v1/users/me/plan').set('Authorization', `Bearer ${account.token}`)
    expect(summary.body.plan).toBe('FREE')
    expect(summary.body.expiresAt).toBeNull()
  })

  it('o dia da cota vira à meia-noite de Brasília, não de UTC', () => {
    // 02:00 UTC de 25/11 ainda é 23:00 de 24/11 em Brasília.
    expect(periodStart('day', new Date('2026-11-25T02:00:00Z')).toISOString()).toBe('2026-11-24T03:00:00.000Z')
    expect(periodStart('month', new Date('2026-12-01T02:00:00Z')).toISOString()).toBe('2026-11-01T03:00:00.000Z')
    expect(effectivePlan({ plan: 'PLUS', planExpiresAt: null })).toBe('PLUS')
  })
})
