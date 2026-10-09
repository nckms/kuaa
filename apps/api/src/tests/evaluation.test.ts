import { beforeEach, describe, expect, it, vi } from 'vitest'
import express from 'express'
import request from 'supertest'
import jwt from 'jsonwebtoken'

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), upsert: vi.fn(), user: vi.fn() }))
vi.mock('../lib/prisma', () => ({ prisma: {
  usabilityEvaluation: { findUnique: mocks.findUnique, upsert: mocks.upsert },
  user: { findUnique: mocks.user },
} }))
vi.mock('../lib/env', () => ({ env: { JWT_SECRET: 'evaluation-test-only' } }))

import { evaluationRouter } from '../modules/evaluation/evaluation.routes'
import { calculateSusScore, evaluationSchema } from '../modules/evaluation/evaluation.schemas'
import { errorHandler } from '../middleware/errorHandler'

const app = express()
app.use(express.json())
app.use('/evaluation', evaluationRouter)
app.use(errorHandler)
const token = (userId: string) => `Bearer ${jwt.sign({ userId }, 'evaluation-test-only')}`
const input = { answers: [5, 1, 5, 1, 5, 1, 5, 1, 5, 1], consent: true }

beforeEach(() => {
  vi.resetAllMocks()
  mocks.user.mockImplementation(async ({ where }: { where: { id: string } }) => ({ id: where.id }))
  mocks.findUnique.mockResolvedValue(null)
  mocks.upsert.mockResolvedValue({ answers: input.answers, score: 100, feedback: null })
})

describe('SUS e validacao', () => {
  it('calcula extremos, neutro e valor intermediario', () => {
    expect(calculateSusScore(input.answers)).toBe(100)
    expect(calculateSusScore([1, 5, 1, 5, 1, 5, 1, 5, 1, 5])).toBe(0)
    expect(calculateSusScore(Array(10).fill(3))).toBe(50)
    expect(calculateSusScore([4, 1, 5, 1, 5, 1, 5, 1, 5, 1])).toBe(97.5)
  })
  it.each([[], Array(9).fill(3), Array(11).fill(3), [0, ...input.answers.slice(1)],
    [6, ...input.answers.slice(1)], [1.5, ...input.answers.slice(1)], ['5', ...input.answers.slice(1)],
    [null, ...input.answers.slice(1)]])('rejeita respostas invalidas: %j', (...answers) => {
    // it.each distribui os elementos de cada array como argumentos.
    expect(evaluationSchema.safeParse({ ...input, answers }).success).toBe(false)
  })
  it('limita feedback antes de trim e normaliza espacos', () => {
    expect(evaluationSchema.safeParse({ ...input, feedback: 'a'.repeat(2000) }).success).toBe(true)
    expect(evaluationSchema.safeParse({ ...input, feedback: ' '.repeat(2001) }).success).toBe(false)
    expect(evaluationSchema.parse({ ...input, feedback: ' texto ' }).feedback).toBe('texto')
  })
})

describe('evaluationRouter sem banco real', () => {
  it('exige autenticacao no GET e POST', async () => {
    expect((await request(app).get('/evaluation/me')).status).toBe(401)
    expect((await request(app).post('/evaluation/me').send(input)).status).toBe(401)
    expect((await request(app).get('/evaluation/me').set('Authorization', 'Bearer invalid')).status).toBe(401)
    expect(mocks.findUnique).not.toHaveBeenCalled()
    expect(mocks.upsert).not.toHaveBeenCalled()
  })
  it('rejeita usuario removido', async () => {
    mocks.user.mockResolvedValue(null)
    expect((await request(app).get('/evaluation/me').set('Authorization', token('removed'))).status).toBe(401)
    expect(mocks.findUnique).not.toHaveBeenCalled()
  })
  it('retorna null e restringe consulta ao usuario autenticado mesmo com query alheia', async () => {
    const response = await request(app).get('/evaluation/me?userId=other').set('Authorization', token('owner'))
    expect(response.status).toBe(200)
    expect(response.body).toBeNull()
    expect(mocks.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'owner' } }))
    const selection = mocks.findUnique.mock.calls[0][0].select
    expect(selection.userId).toBeUndefined()
    expect(selection.user).toBeUndefined()
  })
  it('devolve apenas a avaliacao consultada', async () => {
    mocks.findUnique.mockResolvedValue({ answers: input.answers, score: 100 })
    const response = await request(app).get('/evaluation/me').set('Authorization', token('second'))
    expect(response.body.score).toBe(100)
    expect(mocks.findUnique.mock.calls[0][0].where).toEqual({ userId: 'second' })
  })
  it.each([{}, { consent: false }, { consent: 'true' }, { userId: 'other' }, { score: 99 },
    { answers: Array(9).fill(3) }, { feedback: 'x'.repeat(2001) }])('rejeita payload invalido %j', async (override) => {
    const payload = Object.keys(override).length ? { ...input, ...override } : { answers: input.answers }
    const response = await request(app).post('/evaluation/me').set('Authorization', token('owner')).send(payload)
    expect(response.status).toBe(400)
    expect(mocks.upsert).not.toHaveBeenCalled()
  })
  it('faz upsert proprio com score calculado e limpa comentario omitido', async () => {
    for (let count = 0; count < 2; count++) {
      const response = await request(app).post('/evaluation/me').set('Authorization', token('owner')).send(input)
      expect(response.status).toBe(200)
    }
    expect(mocks.upsert).toHaveBeenCalledTimes(2)
    expect(mocks.upsert).toHaveBeenLastCalledWith(expect.objectContaining({
      where: { userId: 'owner' },
      create: { userId: 'owner', answers: input.answers, score: 100, feedback: null },
      update: { answers: input.answers, score: 100, feedback: null },
    }))
  })
  it('nao disponibiliza listagem nem busca por id', async () => {
    expect((await request(app).get('/evaluation').set('Authorization', token('owner'))).status).toBe(404)
    expect((await request(app).get('/evaluation/other').set('Authorization', token('owner'))).status).toBe(404)
  })
})
