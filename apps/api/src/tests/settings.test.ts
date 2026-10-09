import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'

beforeEach(async () => { await truncateUserData() })
afterAll(async () => { await testPrisma.$disconnect() })

describe('User settings', () => {
  it('requires authentication for reads and writes', async () => {
    expect((await api.get('/api/v1/users/me')).status).toBe(401)
    expect((await api.patch('/api/v1/users/me').send({ preferences: {} })).status).toBe(401)
  })

  it('returns defaults without exposing credentials', async () => {
    const { token } = await registerAndLogin('settings_defaults')
    const res = await api.get('/api/v1/users/me').set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body.preferences).toEqual({ dailyStudyMinutes: 30, reducedMotion: false, highContrast: false })
    expect(res.body.activeVestibularId).toBeNull()
    expect(res.body).not.toHaveProperty('passwordHash')
  })

  it('merges partial preferences and preserves unrelated stored fields', async () => {
    const { token, userId } = await registerAndLogin('settings_merge')
    await testPrisma.user.update({ where: { id: userId }, data: { preferences: { dailyStudyMinutes: 60, highContrast: true, futurePreference: 'preserved' } } })
    const patch = await api.patch('/api/v1/users/me').set('Authorization', `Bearer ${token}`).send({ preferences: { reducedMotion: true }, name: 'Novo Nome' })
    expect(patch.status).toBe(200)
    expect(patch.body.preferences).toEqual({ dailyStudyMinutes: 60, highContrast: true, reducedMotion: true, futurePreference: 'preserved' })
    expect(patch.body.name).toBe('Novo Nome')
    expect(patch.body).not.toHaveProperty('passwordHash')
    const read = await api.get('/api/v1/users/me').set('Authorization', `Bearer ${token}`)
    expect(read.body.preferences).toEqual(patch.body.preferences)
    const profile = await api.patch('/api/v1/users/me').set('Authorization', `Bearer ${token}`).send({ city: 'Recife' })
    expect(profile.body.preferences).toEqual(patch.body.preferences)
  })

  it.each([
    { dailyStudyMinutes: 4 }, { dailyStudyMinutes: 241 }, { dailyStudyMinutes: 30.5 },
    { dailyStudyMinutes: '30' }, { reducedMotion: 'false' }, { highContrast: 1 }, { unknown: true },
  ])('rejects invalid preferences %j without changing stored settings', async (preferences) => {
    const { token } = await registerAndLogin('settings_invalid')
    const res = await api.patch('/api/v1/users/me').set('Authorization', `Bearer ${token}`).send({ preferences })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('VALIDATION_ERROR')
    const read = await api.get('/api/v1/users/me').set('Authorization', `Bearer ${token}`)
    expect(read.body.preferences.dailyStudyMinutes).toBe(30)
  })

  it.each([5, 240])('accepts the daily goal boundary %i', async (dailyStudyMinutes) => {
    const { token } = await registerAndLogin('settings_boundary')
    const res = await api.patch('/api/v1/users/me').set('Authorization', `Bearer ${token}`).send({ preferences: { dailyStudyMinutes } })
    expect(res.status).toBe(200)
    expect(res.body.preferences.dailyStudyMinutes).toBe(dailyStudyMinutes)
  })

  it('only selects an enrollment owned by the authenticated user and persists it', async () => {
    const owner = await registerAndLogin('settings_owner')
    const other = await registerAndLogin('settings_other')
    const catalog = await api.get('/api/v1/vestibulares')
    const vestibularId = catalog.body[0]?.id as string
    expect(vestibularId).toBeTruthy()
    await api.post('/api/v1/enrollments').set('Authorization', `Bearer ${other.token}`).send({ vestibularId }).expect(201)
    const denied = await api.patch('/api/v1/users/me').set('Authorization', `Bearer ${owner.token}`).send({ activeVestibularId: vestibularId, preferences: { highContrast: true } })
    expect(denied.status).toBe(403)
    expect(denied.body.code).toBe('NOT_ENROLLED')
    const unchanged = await api.get('/api/v1/users/me').set('Authorization', `Bearer ${owner.token}`)
    expect(unchanged.body.activeVestibularId).toBeNull()
    expect(unchanged.body.preferences.highContrast).toBe(false)
    await api.post('/api/v1/enrollments').set('Authorization', `Bearer ${owner.token}`).send({ vestibularId }).expect(201)
    const selected = await api.patch('/api/v1/users/me').set('Authorization', `Bearer ${owner.token}`).send({ activeVestibularId: vestibularId })
    expect(selected.status).toBe(200)
    expect(selected.body.activeVestibularId).toBe(vestibularId)
    const read = await api.get('/api/v1/users/me').set('Authorization', `Bearer ${owner.token}`)
    expect(read.body.activeVestibularId).toBe(vestibularId)
  })
})
