import { afterAll, describe, expect, it } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma } from './helpers/truncate'

afterAll(async () => { await testPrisma.$disconnect() })
describe('persistencia SUS em banco de teste, sem participantes reais', () => {
  it('salva apenas a propria avaliacao, atualiza sem duplicar e exige consentimento', async () => {
    const own = await registerAndLogin('sus_persistence')
    const other = await registerAndLogin('sus_private')
    const input = { answers: [5, 1, 5, 1, 5, 1, 5, 1, 5, 1], feedback: 'Dado sintetico de teste automatizado.', consent: true }
    expect((await api.post('/api/v1/evaluation/me').set('Authorization', `Bearer ${own.token}`).send({ ...input, consent: false })).status).toBe(400)
    const saved = await api.post('/api/v1/evaluation/me').set('Authorization', `Bearer ${own.token}`).send(input)
    expect(saved.status).toBe(200)
    expect(saved.body.score).toBe(100)
    const read = await api.get('/api/v1/evaluation/me').set('Authorization', `Bearer ${own.token}`)
    expect(read.body.answers).toEqual(input.answers)
    expect((await api.get('/api/v1/evaluation/me').set('Authorization', `Bearer ${other.token}`)).body).toBeNull()
    const update = await api.post('/api/v1/evaluation/me').set('Authorization', `Bearer ${own.token}`).send({ ...input, answers: Array(10).fill(3) })
    expect(update.body.score).toBe(50)
    expect(await testPrisma.usabilityEvaluation.count({ where: { userId: own.userId } })).toBe(1)
  })
})
