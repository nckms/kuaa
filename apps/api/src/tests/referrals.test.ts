import { beforeEach, describe, expect, it } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'
import { authLimitStores } from '../middleware/authRateLimit'
import { rewardReferral } from '../modules/engagement/referrals'

beforeEach(async () => { await truncateUserData() })

async function invitedBy(code: string, suffix: string) {
  for (const store of authLimitStores) await store.resetAll()
  const email = `test_inv_${suffix}@kuaa-test.com`
  const res = await api.post('/api/v1/auth/register').send({ name: 'Amigo', email, password: 'Senha123!', attribution: { invite: code } })
  expect(res.status).toBe(201)
  return { userId: res.body.user.id as string, token: res.body.accessToken as string }
}

async function finishDiagnostic(token: string) {
  const path = '/api/v1/diagnostic/enem'
  const exam = await testPrisma.vestibular.findUniqueOrThrow({ where: { slug: 'enem' } })
  await api.post('/api/v1/enrollments').set('Authorization', `Bearer ${token}`).send({ vestibularId: exam.id })
  let state = (await api.post(`${path}/profile`).set('Authorization', `Bearer ${token}`).send({ schoolStage: 'medio', examHorizon: 'este-ano', weeklyMinutes: 180, difficultSubjects: [] })).body
  for (let i = 0; i < 12 && state.question; i++) {
    state = (await api.post(`${path}/answer`).set('Authorization', `Bearer ${token}`).send({ questionId: state.question.id, optionId: null })).body
  }
  expect(state.status).toBe('completed')
}

describe('convite entre alunos', () => {
  it('gera link estável e registra quem convidou sem expor no perfil', async () => {
    const host = await registerAndLogin('inv_host')
    const first = (await api.get('/api/v1/users/me/referral').set('Authorization', `Bearer ${host.token}`)).body
    expect(first.code).toMatch(/^[a-z2-9]{8}$/)
    expect(first.url).toMatch(new RegExp(`\\?convite=${first.code}$`))
    expect((await api.get('/api/v1/users/me/referral').set('Authorization', `Bearer ${host.token}`)).body.code).toBe(first.code)
    const friend = await invitedBy(first.code, 'a')
    const row = await testPrisma.user.findUniqueOrThrow({ where: { id: friend.userId } })
    expect(row.referredById).toBe(host.userId)
    const me = await api.get('/api/v1/users/me').set('Authorization', `Bearer ${friend.token}`)
    expect(me.body).not.toHaveProperty('referredById')
  })

  it('só o diagnóstico concluído libera 7 dias de Plus para os dois, uma única vez', async () => {
    const host = await registerAndLogin('inv_reward')
    const { code } = (await api.get('/api/v1/users/me/referral').set('Authorization', `Bearer ${host.token}`)).body
    const friend = await invitedBy(code, 'b')
    expect((await testPrisma.user.findUniqueOrThrow({ where: { id: friend.userId } })).plan).toBe('FREE')
    await finishDiagnostic(friend.token)
    for (const id of [host.userId, friend.userId]) {
      const u = await testPrisma.user.findUniqueOrThrow({ where: { id } })
      expect(u.plan).toBe('PLUS')
      expect(u.planExpiresAt!.getTime()).toBeGreaterThan(Date.now() + 6.9 * 86_400_000)
    }
    expect(await rewardReferral(friend.userId)).toEqual({ invitee: false, inviter: false })
    expect(await testPrisma.planGrant.count({ where: { source: 'referral' } })).toBe(2)
    const stats = (await api.get('/api/v1/users/me/referral').set('Authorization', `Bearer ${host.token}`)).body
    expect(stats).toMatchObject({ joined: 1, rewarded: 1, remainingThisMonth: 4 })
  })

  it('quem convida ganha no máximo 5 vezes em 30 dias; o convidado sempre ganha', async () => {
    const host = await registerAndLogin('inv_cap')
    const { code } = (await api.get('/api/v1/users/me/referral').set('Authorization', `Bearer ${host.token}`)).body
    for (let i = 0; i < 6; i++) {
      const f = await invitedBy(code, `cap${i}`)
      const r = await rewardReferral(f.userId)
      expect(r.invitee).toBe(true)
      expect(r.inviter).toBe(i < 5)
    }
  })

  it('código inválido ou inexistente não impede o cadastro', async () => {
    const f = await invitedBy('naoexiste', 'c')
    expect((await testPrisma.user.findUniqueOrThrow({ where: { id: f.userId } })).referredById).toBeNull()
    for (const store of authLimitStores) await store.resetAll()
    const bad = await api.post('/api/v1/auth/register').send({ name: 'Amigo', email: 'test_inv_bad@kuaa-test.com', password: 'Senha123!', attribution: { invite: '../x' } })
    expect(bad.status).toBe(201)
  })
})
