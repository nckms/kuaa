import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { truncateUserData, testPrisma } from './helpers/truncate'

beforeEach(async () => {
  await truncateUserData()
})

afterAll(async () => {
  await testPrisma.$disconnect()
})

async function getEnemId(): Promise<string> {
  const { token } = await registerAndLogin('vest_lookup')
  const res = await api.get('/api/v1/vestibulares').set('Authorization', `Bearer ${token}`)
  const enem = (res.body as Array<{ slug: string; id: string }>).find((v) => v.slug === 'enem')
  if (!enem) throw new Error('ENEM não encontrado — seed não rodou?')
  return enem.id
}

describe('POST /api/v1/enrollments', () => {
  it('cria matrícula e retorna 201 com vestibular e enrollment', async () => {
    const { token } = await registerAndLogin('enroll_ok')
    const enemId = await getEnemId()

    const res = await api
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${token}`)
      .send({ vestibularId: enemId })

    expect(res.status).toBe(201)
    expect(res.body.enrollment.vestibularId).toBe(enemId)
    expect(res.body.vestibular.slug).toBe('enem')
  })

  it('retorna 409 ao tentar duplicar matrícula', async () => {
    const { token } = await registerAndLogin('enroll_dup')
    const enemId = await getEnemId()

    await api
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${token}`)
      .send({ vestibularId: enemId })

    const res = await api
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${token}`)
      .send({ vestibularId: enemId })

    expect(res.status).toBe(409)
    expect(res.body.code).toBe('ALREADY_ENROLLED')
  })
})

describe('GET /api/v1/enrollments/me', () => {
  it('lista matrículas do usuário com progresso', async () => {
    const { token } = await registerAndLogin('enroll_list')
    const enemId = await getEnemId()

    await api
      .post('/api/v1/enrollments')
      .set('Authorization', `Bearer ${token}`)
      .send({ vestibularId: enemId })

    const res = await api
      .get('/api/v1/enrollments/me')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
    expect(res.body[0].vestibular.slug).toBe('enem')
    expect(res.body[0].progress.totalTopics).toBeGreaterThan(0)
    expect(res.body[0].progress.progressPercent).toBe(0)
  })
})
