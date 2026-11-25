import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('../lib/gemini', () => ({ ai: { models: { generateContent: vi.fn() } } }))
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'

afterAll(() => testPrisma.$disconnect())
beforeEach(truncateUserData)

const DAY = 86_400_000

async function seedOfficial(topicName: string, n: number, prefix = 'cofenem2020q') {
  const topic = await testPrisma.topic.findFirstOrThrow({ where: { name: topicName, subject: { vestibular: { slug: 'enem' } } } })
  for (let i = 1; i <= n; i++) {
    await testPrisma.question.create({ data: {
      id: `${prefix}${String(i).padStart(3, '0')}`, topicId: topic.id, source: 'OFFICIAL', year: 2020, origin: `ENEM 2020 · questão ${i}`,
      body: `Texto oficial ${prefix} número ${i}.`, explanation: 'Explicação pronta da questão oficial, com o raciocínio completo.', difficulty: 3,
      options: ['A', 'B', 'C', 'D', 'E'].map((id) => ({ id, text: `Alternativa ${id} da questão ${i}`, isCorrect: id === 'C' })),
    } })
  }
  return topic
}

async function student(suffix: string, topicId: string) {
  const s = await registerAndLogin(suffix)
  const exam = await testPrisma.vestibular.findUniqueOrThrow({ where: { slug: 'enem' } })
  await api.post('/api/v1/enrollments').set('Authorization', `Bearer ${s.token}`).send({ vestibularId: exam.id })
  await testPrisma.userTopicProgress.upsert({ where: { userId_topicId: { userId: s.userId, topicId } }, update: { unlocked: true }, create: { userId: s.userId, topicId, unlocked: true } })
  return { ...s, auth: `Bearer ${s.token}` }
}

async function answerAll(auth: string, sessionId: string, pick: (q: { id: string }) => string) {
  const session = (await api.get(`/api/v1/quiz/${sessionId}`).set('Authorization', auth)).body
  for (const q of session.questions) {
    const res = await api.post(`/api/v1/quiz/${sessionId}/answer`).set('Authorization', auth).send({ questionId: q.id, optionId: pick(q), timeSpentMs: 15000 })
    expect(res.status).toBe(200)
  }
  return session
}

describe('caderno de erros', () => {
  it('erro entra no caderno, volta em 1 dia e sai depois de dois acertos seguidos', async () => {
    const topic = await seedOfficial('Interpretação de Texto', 3)
    const s = await student('review_flow', topic.id)
    const gen = await api.post('/api/v1/quiz/generate').set('Authorization', s.auth).send({ topicId: topic.id, count: 3 })
    expect(gen.status).toBe(201)
    // Erra a primeira, acerta as outras.
    let first = true
    await answerAll(s.auth, gen.body.sessionId, () => { const o = first ? 'A' : 'C'; first = false; return o })
    await api.post(`/api/v1/quiz/${gen.body.sessionId}/finish`).set('Authorization', s.auth)

    let overview = (await api.get('/api/v1/review').set('Authorization', s.auth)).body
    expect(overview).toMatchObject({ open: 1, due: 0, resolved: 0 })
    const item = await testPrisma.reviewItem.findFirstOrThrow({ where: { userId: s.userId } })
    expect(item.questionKey).toMatch(/^cofenem2020q00\d$/)
    expect(item.dueAt.getTime() - Date.now()).toBeGreaterThan(0.9 * DAY)

    // Venceu: aparece para hoje.
    await testPrisma.reviewItem.update({ where: { id: item.id }, data: { dueAt: new Date(Date.now() - 1000) } })
    overview = (await api.get('/api/v1/review').set('Authorization', s.auth)).body
    expect(overview.due).toBe(1)
    expect(overview.topics[0]).toMatchObject({ topicId: topic.id, due: 1, open: 1 })
    expect(overview.items[0].origin).toMatch(/^ENEM 2020/)

    // Revisão: mesma questão, não gasta a cota de práticas.
    const review = await api.post(`/api/v1/review/${topic.id}/start`).set('Authorization', s.auth)
    expect(review.status).toBe(201)
    const reviewSession = await testPrisma.quizSession.findUniqueOrThrow({ where: { id: review.body.sessionId } })
    expect(reviewSession.isReview).toBe(true)
    const shown = await answerAll(s.auth, review.body.sessionId, () => 'C')
    expect(shown.questions).toHaveLength(1)
    expect(shown.questions[0].body).toContain('Texto oficial')
    await api.post(`/api/v1/quiz/${review.body.sessionId}/finish`).set('Authorization', s.auth)
    let updated = await testPrisma.reviewItem.findUniqueOrThrow({ where: { id: item.id } })
    expect(updated.correctStreak).toBe(1)
    expect(updated.resolvedAt).toBeNull()
    expect(updated.dueAt.getTime() - Date.now()).toBeGreaterThan(2.9 * DAY)

    // Segundo acerto seguido: sai do caderno.
    const again = await api.post(`/api/v1/review/${topic.id}/start`).set('Authorization', s.auth)
    await answerAll(s.auth, again.body.sessionId, () => 'C')
    updated = await testPrisma.reviewItem.findUniqueOrThrow({ where: { id: item.id } })
    expect(updated.resolvedAt).not.toBeNull()
    overview = (await api.get('/api/v1/review').set('Authorization', s.auth)).body
    expect(overview).toMatchObject({ open: 0, resolved: 1 })
    expect((await api.post(`/api/v1/review/${topic.id}/start`).set('Authorization', s.auth)).status).toBe(404)
  })

  it('errar na revisão recomeça a contagem', async () => {
    const topic = await seedOfficial('Interpretação de Texto', 3)
    const s = await student('review_reset', topic.id)
    const gen = await api.post('/api/v1/quiz/generate').set('Authorization', s.auth).send({ topicId: topic.id, count: 3 })
    let first = true
    await answerAll(s.auth, gen.body.sessionId, () => { const o = first ? 'A' : 'C'; first = false; return o })
    const item = await testPrisma.reviewItem.findFirstOrThrow({ where: { userId: s.userId } })
    await testPrisma.reviewItem.update({ where: { id: item.id }, data: { correctStreak: 1 } })
    const review = await api.post(`/api/v1/review/${topic.id}/start`).set('Authorization', s.auth)
    await answerAll(s.auth, review.body.sessionId, () => 'B')
    const updated = await testPrisma.reviewItem.findUniqueOrThrow({ where: { id: item.id } })
    expect(updated).toMatchObject({ correctStreak: 0, timesWrong: 2, resolvedAt: null })
  })

  it('revisão de tópico não liberado na trilha termina sem mexer no progresso', async () => {
    const topic = await seedOfficial('Interpretação de Texto', 3)
    const s = await student('review_locked', topic.id)
    const gen = await api.post('/api/v1/quiz/generate').set('Authorization', s.auth).send({ topicId: topic.id, count: 3 })
    await answerAll(s.auth, gen.body.sessionId, () => 'A')
    await api.post(`/api/v1/quiz/${gen.body.sessionId}/finish`).set('Authorization', s.auth)
    await testPrisma.userTopicProgress.deleteMany({ where: { userId: s.userId, topicId: topic.id } })
    const review = await api.post(`/api/v1/review/${topic.id}/start`).set('Authorization', s.auth)
    await answerAll(s.auth, review.body.sessionId, () => 'C')
    const finished = await api.post(`/api/v1/quiz/${review.body.sessionId}/finish`).set('Authorization', s.auth)
    expect(finished.status).toBe(200)
    expect(await testPrisma.userTopicProgress.count({ where: { userId: s.userId, topicId: topic.id } })).toBe(0)
  })

  it('erros da prova anterior entram no caderno ao entregar', async () => {
    const topic = await testPrisma.topic.findFirstOrThrow({ where: { name: 'Interpretação de Texto', subject: { vestibular: { slug: 'enem' } } } })
    for (let n = 6; n <= 17; n++) {
      await testPrisma.question.create({ data: {
        id: `cofenem2022q${String(n).padStart(3, '0')}`, topicId: topic.id, source: 'OFFICIAL', year: 2022, origin: `ENEM 2022 · questão ${n}`,
        body: `Enunciado ${n}`, explanation: '', difficulty: 3,
        options: ['A', 'B', 'C', 'D', 'E'].map((id) => ({ id, text: `Opção ${id}`, isCorrect: id === 'B' })),
      } })
    }
    const s = await student('review_exam', topic.id)
    const started = await api.post('/api/v1/exams/enem/2022/1/start').set('Authorization', s.auth).send({ language: 'ingles' })
    expect(started.status).toBe(201)
    const id = started.body.id
    const answers: Record<string, string> = { cofenem2022q006: 'A', cofenem2022q007: 'B' }
    for (const [questionId, optionId] of Object.entries(answers)) {
      await api.patch(`/api/v1/exams/attempts/${id}/answer`).set('Authorization', s.auth).send({ questionId, optionId })
    }
    expect((await api.post(`/api/v1/exams/attempts/${id}/finish`).set('Authorization', s.auth)).status).toBe(200)
    const items = await testPrisma.reviewItem.findMany({ where: { userId: s.userId } })
    expect(items.map((i) => i.questionKey)).toEqual(['cofenem2022q006'])
  })
})
