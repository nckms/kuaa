import { beforeAll, beforeEach, afterAll, describe, expect, it } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'

let auth: Awaited<ReturnType<typeof registerAndLogin>>
let topicId: string
beforeAll(truncateUserData)
beforeEach(async () => {
  auth = await registerAndLogin(`performance_${Date.now()}`)
  const exam = await testPrisma.vestibular.findUniqueOrThrow({ where: { slug: 'enem' } })
  expect((await api.post('/api/v1/enrollments').set('Authorization', `Bearer ${auth.token}`)
    .send({ vestibularId: exam.id })).status).toBe(201)
  const trail = await api.get('/api/v1/trail/enem').set('Authorization', `Bearer ${auth.token}`)
  topicId = trail.body.subjects[0].topics[0].id
})
afterAll(() => testPrisma.$disconnect())

async function practice(count: number, correct = true, difficulty = 1) {
  const session = await testPrisma.quizSession.create({ data: { userId: auth.userId, topicId } })
  for (let index = 0; index < count; index++) {
    const question = await testPrisma.question.create({ data: {
      topicId, generatedForSessionId: session.id, difficulty, body: `Pergunta de teste ${index}`,
      explanation: 'Explicacao da questao de teste.',
      options: [{ id: 'A', text: 'Correta', isCorrect: true }, { id: 'B', text: 'Errada', isCorrect: false }],
    } })
    expect((await api.post(`/api/v1/quiz/${session.id}/answer`).set('Authorization', `Bearer ${auth.token}`)
      .send({ questionId: question.id, optionId: correct ? 'A' : 'B', timeSpentMs: 30000 })).status).toBe(200)
  }
  return session.id
}
const finish = (id: string) => api.post(`/api/v1/quiz/${id}/finish`).set('Authorization', `Bearer ${auth.token}`)

describe('performance from answers to the next session', () => {
  it('persists short-session progress, updates trail and generation, and preserves old results', async () => {
    const firstId = await practice(3)
    const first = await finish(firstId)
    expect(first.status).toBe(200)
    expect(first.body.performance).toMatchObject({ newLevel: 0, pendingAnswers: 3 })
    const secondId = await practice(3)
    const second = await finish(secondId)
    expect(second.status).toBe(200)
    expect(second.body.performance).toMatchObject({ previousLevel: 0, newLevel: 1, evidenceCount: 6 })
    expect((await finish(secondId)).body.performance).toEqual(second.body.performance)
    const trail = await api.get('/api/v1/trail/enem').set('Authorization', `Bearer ${auth.token}`)
    expect(trail.body.subjects[0].topics[0].progress.masteryLevel).toBe(1)
    expect(trail.body.recommendation.targetDifficulty).toBe(2)
    const generated = await api.post('/api/v1/quiz/generate').set('Authorization', `Bearer ${auth.token}`)
      .send({ topicId, count: 3 })
    expect(generated.status).toBe(201)
    const next = await api.get(`/api/v1/quiz/${generated.body.sessionId}`).set('Authorization', `Bearer ${auth.token}`)
    expect(next.body.generation.targetDifficulty).toBe(2)
    expect(next.body.generation.source).toBe('CURATED')
    const old = await api.get(`/api/v1/quiz/${firstId}/summary`).set('Authorization', `Bearer ${auth.token}`)
    expect(old.body.newMasteryLevel).toBe(0)
    expect(old.body.performance).toEqual(first.body.performance)
  })
  it('serializes simultaneous finishes and does not advance on an empty session', async () => {
    const first = await practice(3)
    const second = await practice(3)
    const results = await Promise.all([finish(first), finish(second)])
    expect(results.map((response) => response.status)).toEqual([200, 200])
    const levels = results.map((response) => response.body.newMasteryLevel).sort()
    expect(levels).toEqual([0, 1])
    const empty = await practice(0)
    expect((await finish(empty)).body.newMasteryLevel).toBe(1)
    expect((await finish(first)).body.newMasteryLevel).toBe(results[0]!.body.newMasteryLevel)
  })
  it('low performance creates reinforcement and later success allows recovery', async () => {
    await testPrisma.userTopicProgress.update({ where: { userId_topicId: { userId: auth.userId, topicId } }, data: { masteryLevel: 3 } })
    const weak = await finish(await practice(5, false, 3))
    expect(weak.body.performance).toMatchObject({ newLevel: 2, decision: 'reinforce' })
    const trail = await api.get('/api/v1/trail/enem').set('Authorization', `Bearer ${auth.token}`)
    expect(trail.body.recommendation).toMatchObject({ topicId, kind: 'reinforcement', targetDifficulty: 2 })
    const recovered = await finish(await practice(5, true, 3))
    expect(recovered.body.performance).toMatchObject({ newLevel: 3, decision: 'advance' })
  })
  it('isolates pending evidence between students', async () => {
    await finish(await practice(3))
    const other = await registerAndLogin(`performance_other_${Date.now()}`)
    await testPrisma.userTopicProgress.create({ data: { userId: other.userId, topicId, unlocked: true } })
    auth = other
    const result = await finish(await practice(3))
    expect(result.body.performance).toMatchObject({ newLevel: 0, pendingAnswers: 3, evidenceCount: 3 })
  })
})
