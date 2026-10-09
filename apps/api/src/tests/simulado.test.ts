import { describe, it, expect, beforeAll } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { truncateUserData, testPrisma } from './helpers/truncate'
import type { StoredQuestion } from '../modules/simulado/simulado.results'

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
let userId: string
let attemptId: string
let questions: StoredQuestion[]

beforeAll(async () => {
  await truncateUserData()

  const auth = await registerAndLogin('simulado_test')
  token = auth.token
  userId = auth.userId

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
    expect(new Set(res.body.questions.map((q: { body: string }) => q.body)).size).toBe(45)
    expect(res.body.questions.every((q: object) => !('correctOptionId' in q) && !('explanation' in q))).toBe(true)
    expect(res.body.finishedAt).toBeNull()
    expect(res.body.vestibularName).toBe('ENEM')
    attemptId = res.body.id
    const stored = await testPrisma.simuladoAttempt.findUniqueOrThrow({ where: { id: attemptId } })
    questions = stored.questions as unknown as StoredQuestion[]
    expect(questions.every((question) => question.topicId && question.difficulty)).toBe(true)

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

  it('rejeita questoes e alternativas que nao pertencem ao simulado', async () => {
    for (const input of [
      { questionId: 'inexistente', optionId: 'A' },
      { questionId: questions[0]!.id, optionId: 'Z' },
    ]) {
      const res = await api.patch(`/api/v1/simulado/attempt/${attemptId}/answer`)
        .set('Authorization', `Bearer ${token}`).send(input)
      expect(res.status).toBe(400)
    }
  })

  it('preserva respostas de requisicoes simultaneas', async () => {
    const responses = await Promise.all(questions.slice(0, 3).map((question, index) => {
      const optionId = question.options.find((option) => option.isCorrect === (index < 2))!.id
      return api.patch(`/api/v1/simulado/attempt/${attemptId}/answer`)
        .set('Authorization', `Bearer ${token}`).send({ questionId: question.id, optionId })
    }))
    expect(responses.map((response) => response.status)).toEqual([200, 200, 200])
    const attempt = await testPrisma.simuladoAttempt.findUniqueOrThrow({ where: { id: attemptId } })
    expect(Object.keys(attempt.answers as object)).toHaveLength(3)
  })

  it('nao inclui respostas do simulado no diagnostico antes de finalizar', async () => {
    const trail = await api.get('/api/v1/trail/enem').set('Authorization', `Bearer ${token}`)
    expect(trail.body.summary.answeredQuestions).toBe(0)
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
    expect(res.body.correct).toBe(2)
    expect(res.body.wrong).toBe(1)
  })

  it('atualiza trilha, dashboard e indice com acertos e lacunas do simulado', async () => {
    const trail = await api.get('/api/v1/trail/enem').set('Authorization', `Bearer ${token}`)
    expect(trail.status).toBe(200)
    expect(trail.body.summary).toMatchObject({
      answeredQuestions: 3, correctAnswers: 2, wrongAnswers: 1, accuracy: 67,
      totalSessions: 1, finishedSessions: 1,
    })
    expect(trail.body.summary.knowledgeGaps).toEqual(expect.arrayContaining([
      expect.objectContaining({ topicId: questions[2]!.topicId, wrongAnswers: 1 }),
    ]))
    const index = await api.get('/api/v1/index/enem').set('Authorization', `Bearer ${token}`)
    expect(index.status).toBe(200)
    expect(index.body.score).toBeGreaterThan(300)
    expect(index.body.score).toBeLessThan(1000)
    expect(index.body.subjectBreakdown.length).toBeGreaterThan(0)
    expect(await testPrisma.indexSnapshot.count({ where: { userId } })).toBe(1)
  })

  it('finalizar novamente nao duplica resultados nem historico', async () => {
    const res = await api.post(`/api/v1/simulado/attempt/${attemptId}/finish`)
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ correct: 2, wrong: 1 })
    expect(await testPrisma.indexSnapshot.count({ where: { userId } })).toBe(1)
    const trail = await api.get('/api/v1/trail/enem').set('Authorization', `Bearer ${token}`)
    expect(trail.body.summary.answeredQuestions).toBe(3)
  })

  it('exige matricula e impede acesso a tentativa de outro usuario', async () => {
    const other = await registerAndLogin('simulado_other')
    const start = await api.post('/api/v1/simulado/enem/start')
      .set('Authorization', `Bearer ${other.token}`)
    expect(start.status).toBe(403)
    const finish = await api.post(`/api/v1/simulado/attempt/${attemptId}/finish`)
      .set('Authorization', `Bearer ${other.token}`)
    expect(finish.status).toBe(404)
  })

  it('libera gabarito e explicacoes somente na tentativa finalizada', async () => {
    const current = await api.get('/api/v1/simulado/enem/current').set('Authorization', `Bearer ${token}`)
    expect(current.status).toBe(200)
    expect(current.body.finishedAt).toBeTruthy()
    for (const question of current.body.questions) {
      expect(question.options.some((option: { id: string }) => option.id === question.correctOptionId)).toBe(true)
      expect(question.explanation.length).toBeGreaterThan(20)
    }
  })

  it('bloqueia resposta atrasada e encerra tentativa expirada ao retomar', async () => {
    const expired = await registerAndLogin('simulado_expired')
    await api.post('/api/v1/enrollments').set('Authorization', `Bearer ${expired.token}`)
      .send({ vestibularId })
    const start = await api.post('/api/v1/simulado/enem/start')
      .set('Authorization', `Bearer ${expired.token}`)
    const expiredId = start.body.id as string
    await testPrisma.simuladoAttempt.update({
      where: { id: expiredId }, data: { startedAt: new Date(Date.now() - 91 * 60 * 1000) },
    })
    const late = await api.patch(`/api/v1/simulado/attempt/${expiredId}/answer`)
      .set('Authorization', `Bearer ${expired.token}`)
      .send({ questionId: start.body.questions[0].id, optionId: 'A' })
    expect(late.status).toBe(409)
    expect(late.body.code).toBe('TIME_EXPIRED')
    const current = await api.get('/api/v1/simulado/enem/current')
      .set('Authorization', `Bearer ${expired.token}`)
    expect(current.body.finishedAt).toBeTruthy()
    expect(current.body).toMatchObject({ correct: 0, wrong: 0, answers: {} })
  })
})
