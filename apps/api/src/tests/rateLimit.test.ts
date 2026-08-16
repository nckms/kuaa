import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { truncateUserData, testPrisma } from './helpers/truncate'

let token: string

beforeAll(async () => {
  await truncateUserData()

  const auth = await registerAndLogin('rate_limit')
  token = auth.token

  // Enroll para ter acesso ao generate
  const vestRes = await api.get('/api/v1/vestibulares').set('Authorization', `Bearer ${token}`)
  const enemId = (vestRes.body as Array<{ slug: string; id: string }>)
    .find((v) => v.slug === 'enem')?.id
  if (!enemId) throw new Error('ENEM não encontrado')

  await api
    .post('/api/v1/enrollments')
    .set('Authorization', `Bearer ${token}`)
    .send({ vestibularId: enemId })
})

afterAll(async () => {
  await testPrisma.$disconnect()
})

describe('Rate limit — POST /api/v1/quiz/generate', () => {
  it('retorna 429 na 11ª requisição no mesmo usuário dentro de 5 minutos', async () => {
    // Enviar 10 requests — o rate limiter conta independente do resultado do controller
    // (auth passa, rate limit conta, depois vai pro controller que pode rejeitar por validação)
    const results: number[] = []

    for (let i = 0; i < 10; i++) {
      const res = await api
        .post('/api/v1/quiz/generate')
        .set('Authorization', `Bearer ${token}`)
        .send({ topicId: 'topicid-inexistente', count: 3 })

      // Pode ser 404 (topic not found) ou 403 (not enrolled no topic) — não importa, só não deve ser 429
      expect(res.status).not.toBe(429)
      results.push(res.status)
    }

    // 11ª deve ser 429
    const res11 = await api
      .post('/api/v1/quiz/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ topicId: 'topicid-inexistente', count: 3 })

    expect(res11.status).toBe(429)
    expect(res11.body.error).toBe('Muitas gerações de questão em pouco tempo. Aguarde alguns minutos.')
    expect(res11.body.code).toBe('RATE_LIMIT_EXCEEDED')
  })
})
