import { beforeEach, describe, expect, it } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'
import { memoryOutbox } from '../lib/mailer'
import { runWeeklyEmails, unsubscribeToken, verifyUnsubscribeToken, weekKey } from '../modules/engagement/weeklyEmail'

beforeEach(async () => {
  await truncateUserData()
  memoryOutbox.length = 0
})

async function student(suffix: string, daysAgo = 10) {
  const account = await registerAndLogin(suffix)
  const enem = await testPrisma.vestibular.findUniqueOrThrow({ where: { slug: 'enem' } })
  await api.post('/api/v1/enrollments').set('Authorization', `Bearer ${account.token}`).send({ vestibularId: enem.id })
  await testPrisma.user.update({ where: { id: account.userId }, data: { createdAt: new Date(Date.now() - daysAgo * 86_400_000) } })
  return account
}

describe('e-mail semanal de próximo passo', () => {
  it('semana ISO no horário de Brasília', () => {
    expect(weekKey(new Date('2026-11-24T15:00:00Z'))).toBe('2026-W48')
    // Domingo 23h em Brasília (segunda 02h UTC) ainda é a semana anterior.
    expect(weekKey(new Date('2026-11-30T02:00:00Z'))).toBe('2026-W48')
    expect(weekKey(new Date('2027-01-01T12:00:00Z'))).toBe('2026-W53')
  })

  it('simulação conta sem enviar; envio real manda o próximo tópico e não repete na mesma semana', async () => {
    const account = await student('weekly_a')
    await student('weekly_new', 1) // cadastrado há 1 dia: ainda não recebe
    expect(await runWeeklyEmails({ dryRun: true })).toMatchObject({ eligible: 1, sent: 0 })
    expect(memoryOutbox).toHaveLength(0)
    expect(await runWeeklyEmails({ dryRun: false })).toMatchObject({ eligible: 1, sent: 1, failed: 0 })
    expect(memoryOutbox).toHaveLength(1)
    const mail = memoryOutbox[0]
    expect(mail.to).toBe(account.email)
    expect(mail.subject).toMatch(/^Seu próximo passo no Kuaa/)
    expect(mail.text).toContain('/dashboard')
    expect(mail.text).toMatch(/\/descadastrar#token=/)
    expect(await runWeeklyEmails({ dryRun: false })).toMatchObject({ eligible: 0, sent: 0, skippedAlreadySent: 1 })
    expect(memoryOutbox).toHaveLength(1)
  })

  it('o link de descadastro desliga o e-mail sem login; token adulterado é recusado', async () => {
    const account = await student('weekly_unsub')
    const token = unsubscribeToken(account.userId)
    expect(verifyUnsubscribeToken(token)).toBe(account.userId)
    expect((await api.post('/api/v1/users/unsubscribe').send({ token: token.slice(0, -2) + 'xx' })).status).toBe(400)
    expect((await api.post('/api/v1/users/unsubscribe').send({ token })).status).toBe(200)
    const me = await api.get('/api/v1/users/me').set('Authorization', `Bearer ${account.token}`)
    expect(me.body.preferences.weeklyEmail).toBe(false)
    expect(await runWeeklyEmails({ dryRun: false })).toMatchObject({ eligible: 0, sent: 0 })
  })

  it('a preferência pode ser religada nas configurações', async () => {
    const account = await student('weekly_pref')
    const res = await api.patch('/api/v1/users/me').set('Authorization', `Bearer ${account.token}`).send({ preferences: { weeklyEmail: false } })
    expect(res.body.preferences.weeklyEmail).toBe(false)
    expect((await runWeeklyEmails({ dryRun: true })).eligible).toBe(0)
    await api.patch('/api/v1/users/me').set('Authorization', `Bearer ${account.token}`).send({ preferences: { weeklyEmail: true } })
    expect((await runWeeklyEmails({ dryRun: true })).eligible).toBe(1)
  })
})
