import { describe, it, expect, beforeAll } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { truncateUserData } from './helpers/truncate'

/**
 * Testes do Simulado da Semana.
 *
 * GEMINI_API_KEY ausente em .env.test → geração via generateFallbackQuestions.
 * ENEM tem 4 subjects × peso 0.25 cada → distribuição esperada: 45 questões.
 *
 * Trava semanal: segunda chamada a POST /start deve retornar 409.
 */

let token: string
let vestibularId: string

beforeAll(async () => {
  await truncateUserData()

  const auth = await registerAndLogin('simulado_test')
  token = auth.token

  // Obter ENEM
  const vestRes = await api.get('/api/v1/vestibulares').set('Authorization', `Bearer ${token}`)
  const enem = (vestRes.body as Array<{ slug: string; id: string }>).find((v) => v.slug === 'enem')
  if (!enem) throw new Error('ENEM não encontrado — seed não rodou?')
  vestibularId = enem.id

  // Matricular
  await api
    .post('/api/v1/enrollments')
    .set('Authorization', `Bearer ${token}`)
    .send({ vestibularId })
})

describe('Simulado da Semana', () => {
  it('GET /current retorna null antes de iniciar', async () => {
    const res = await api
      .get('/api/v1/simulado/enem/current')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toBeNull()
  })

  it('POST /start cria simulado com exatamente 45 questões', async () => {
    const res = await api
      .post('/api/v1/simulado/enem/start')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.id).toBeTruthy()
    expect(res.body.questions).toHaveLength(45)
    expect(res.body.finishedAt).toBeNull()
    expect(res.body.vestibularName).toBe('ENEM')

    // Cada questão deve ter os campos esperados (sem isCorrect)
    const q = res.body.questions[0]
    expect(q.id).toBeTruthy()
    expect(q.body).toBeTruthy()
    expect(q.options).toHaveLength(5)
    expect(q.options[0]).not.toHaveProperty('isCorrect')
  })

  it('GET /current retorna o simulado iniciado', async () => {
    const res = await api
      .get('/api/v1/simulado/enem/current')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).not.toBeNull()
    expect(res.body.questions).toHaveLength(45)
  })

  it('POST /start retorna 409 na segunda tentativa na mesma semana (trava semanal)', async () => {
    const res = await api
      .post('/api/v1/simulado/enem/start')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(409)
    expect(res.body.code).toBe('ALREADY_ATTEMPTED')
    expect(res.body.error).toMatch(/próximo domingo/i)
  })

  it('PATCH /answer salva resposta corretamente', async () => {
    // Obter attemptId
    const currentRes = await api
      .get('/api/v1/simulado/enem/current')
      .set('Authorization', `Bearer ${token}`)
    const attempt = currentRes.body as { id: string; questions: Array<{ id: string; options: Array<{ id: string }> }> }
    const q = attempt.questions[0]!

    const res = await api
      .patch(`/api/v1/simulado/attempt/${attempt.id}/answer`)
      .set('Authorization', `Bearer ${token}`)
      .send({ questionId: q.id, optionId: q.options[0]!.id })

    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  })

  it('POST /finish finaliza e retorna score 300-1000', async () => {
    const currentRes = await api
      .get('/api/v1/simulado/enem/current')
      .set('Authorization', `Bearer ${token}`)
    const attempt = currentRes.body as { id: string }

    const res = await api
      .post(`/api/v1/simulado/attempt/${attempt.id}/finish`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.score).toBeGreaterThanOrEqual(300)
    expect(res.body.score).toBeLessThanOrEqual(1000)
    expect(res.body.total).toBe(45)
    expect(res.body.finishedAt).toBeTruthy()
  })
})
