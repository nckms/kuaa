import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'
import { env } from '../lib/env'
import { brtDay, PUSH_KIND, runDailyReminders, setPushSender, type PushPayload } from '../modules/engagement/push'

const sent: Array<{ endpoint: string; payload: PushPayload }> = []
const gone = new Set<string>()
const SUB = (n: number) => ({ endpoint: `https://fcm.googleapis.com/fcm/send/test-${n}`, keys: { p256dh: 'B'.repeat(87), auth: 'a'.repeat(22) } })
// 19h30 de Brasília = 22h30 UTC.
const AT_19H = new Date('2026-11-26T22:30:00.000Z')

beforeAll(() => {
  Object.assign(env, { VAPID_PUBLIC_KEY: 'BPublicKeyForTestsOnly', VAPID_PRIVATE_KEY: 'private-test-only' })
  setPushSender(async (sub, payload) => {
    if (gone.has(sub.endpoint)) throw Object.assign(new Error('Gone'), { statusCode: 410 })
    sent.push({ endpoint: sub.endpoint, payload })
  })
})
afterAll(() => { Object.assign(env, { VAPID_PUBLIC_KEY: undefined, VAPID_PRIVATE_KEY: undefined }) })
beforeEach(async () => { await truncateUserData(); sent.length = 0; gone.clear() })

async function enrolledStudent(suffix: string) {
  const s = await registerAndLogin(suffix)
  const exam = await testPrisma.vestibular.findUniqueOrThrow({ where: { slug: 'enem' } })
  await api.post('/api/v1/enrollments').set('Authorization', `Bearer ${s.token}`).send({ vestibularId: exam.id })
  // Conta criada há 2 dias, com atividade ontem.
  await testPrisma.user.update({ where: { id: s.userId }, data: { createdAt: new Date(AT_19H.getTime() - 2 * 86_400_000), lastActivityAt: new Date(AT_19H.getTime() - 86_400_000), streakDays: 3 } })
  return s
}

describe('lembretes por notificação', () => {
  it('config pública e inscrição validada (só https, só logado)', async () => {
    expect((await api.get('/api/v1/push/config')).body).toMatchObject({ enabled: true, publicKey: 'BPublicKeyForTestsOnly', hourBrt: 19 })
    expect((await api.post('/api/v1/push/subscribe').send(SUB(1))).status).toBe(401)
    const s = await registerAndLogin('push_sub')
    const bad = await api.post('/api/v1/push/subscribe').set('Authorization', `Bearer ${s.token}`).send({ ...SUB(1), endpoint: 'http://evil.test/x' })
    expect(bad.status).toBe(400)
    expect((await api.post('/api/v1/push/subscribe').set('Authorization', `Bearer ${s.token}`).send(SUB(1))).status).toBe(201)
    expect((await api.post('/api/v1/push/subscribe').set('Authorization', `Bearer ${s.token}`).send(SUB(1))).status).toBe(201)
    expect((await api.get('/api/v1/push/status').set('Authorization', `Bearer ${s.token}`)).body).toEqual({ enabled: true, devices: 1 })
    expect((await api.delete('/api/v1/push/subscribe').set('Authorization', `Bearer ${s.token}`).send({ endpoint: SUB(1).endpoint })).status).toBe(204)
    expect(await testPrisma.pushSubscription.count()).toBe(0)
  })

  it('às 19h lembra quem não estudou hoje, com sequência e próximo tópico; uma vez por dia', async () => {
    const s = await enrolledStudent('push_daily')
    await api.post('/api/v1/push/subscribe').set('Authorization', `Bearer ${s.token}`).send(SUB(2))
    expect((await runDailyReminders({ now: new Date('2026-11-26T15:00:00.000Z') })).eligible).toBe(0) // 12h: fora da hora
    const first = await runDailyReminders({ now: AT_19H })
    expect(first).toMatchObject({ eligible: 1, sent: 1 })
    expect(sent[0].payload.title).toContain('3 dias')
    expect(sent[0].payload.body).toMatch(/^Próximo: .+\./)
    expect(sent[0].payload.url).toBe('/dashboard?origem=lembrete')
    expect((await runDailyReminders({ now: new Date(AT_19H.getTime() + 20 * 60_000) })).sent).toBe(0)
    expect(await testPrisma.emailLog.count({ where: { userId: s.userId, kind: PUSH_KIND, periodKey: brtDay(AT_19H).key } })).toBe(1)
  })

  it('não lembra quem já estudou hoje, quem desligou, nem quem sumiu há mais de 21 dias', async () => {
    const studied = await enrolledStudent('push_studied')
    await testPrisma.user.update({ where: { id: studied.userId }, data: { lastActivityAt: new Date(AT_19H.getTime() - 3600_000) } })
    const off = await enrolledStudent('push_off')
    await testPrisma.user.update({ where: { id: off.userId }, data: { preferences: { pushReminders: false } } })
    const gone21 = await enrolledStudent('push_gone')
    await testPrisma.user.update({ where: { id: gone21.userId }, data: { lastActivityAt: new Date(AT_19H.getTime() - 30 * 86_400_000) } })
    for (const [i, s] of [studied, off, gone21].entries()) await api.post('/api/v1/push/subscribe').set('Authorization', `Bearer ${s.token}`).send(SUB(10 + i))
    const r = await runDailyReminders({ now: AT_19H })
    expect(r).toMatchObject({ sent: 0, skippedStudiedToday: 1 })
    expect(sent).toHaveLength(0)
  })

  it('inscrição expirada (410) é removida', async () => {
    const s = await enrolledStudent('push_expired')
    await api.post('/api/v1/push/subscribe').set('Authorization', `Bearer ${s.token}`).send(SUB(20))
    gone.add(SUB(20).endpoint)
    expect(await runDailyReminders({ now: AT_19H })).toMatchObject({ removedExpired: 1, failed: 1 })
    expect(await testPrisma.pushSubscription.count()).toBe(0)
  })
})
