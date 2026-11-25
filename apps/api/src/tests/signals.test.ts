import { beforeEach, describe, expect, it } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'

beforeEach(async () => { await truncateUserData() })

describe('intenção de compra', () => {
  it('pedido de aviso do Plus é idempotente e exige login', async () => {
    expect((await api.post('/api/v1/billing/interest').send({ source: 'planos' })).status).toBe(401)
    const s = await registerAndLogin('interest')
    expect((await api.get('/api/v1/billing/interest').set('Authorization', `Bearer ${s.token}`)).body).toEqual({ registered: false })
    expect((await api.post('/api/v1/billing/interest').set('Authorization', `Bearer ${s.token}`).send({ source: 'planos' })).status).toBe(201)
    expect((await api.post('/api/v1/billing/interest').set('Authorization', `Bearer ${s.token}`).send({ source: 'xss<script>' })).status).toBe(201)
    expect((await api.get('/api/v1/billing/interest').set('Authorization', `Bearer ${s.token}`)).body).toEqual({ registered: true })
    const rows = await testPrisma.productSignal.findMany({ where: { userId: s.userId } })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ kind: 'plus-interest', source: 'planos' })
  })

  it('bater na cota do gratuito registra um sinal por cota por dia', async () => {
    const s = await registerAndLogin('quota_signal')
    for (let i = 0; i < 15; i++) await testPrisma.sabiaMessage.create({ data: { userId: s.userId, role: 'user', content: `pergunta ${i}` } })
    for (let i = 0; i < 2; i++) {
      const res = await api.post('/api/v1/sabia/ask').set('Authorization', `Bearer ${s.token}`).send({ message: 'O que é mitose?' })
      expect(res.status).toBe(429)
    }
    await new Promise((r) => setTimeout(r, 200))
    const rows = await testPrisma.productSignal.findMany({ where: { userId: s.userId } })
    expect(rows.map((r) => r.kind)).toEqual(['quota-hit:sabia'])
  })
})
