import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'

let token: string
let userId: string
let examId: string
let topicId: string
const slug = 'test-question-media'
const visual = { type: 'line', title: 'Distância percorrida', xLabel: 'Tempo (s)', yLabel: 'Distância (m)',
  points: [{ label: '0', value: 0 }, { label: '1', value: 3 }] }
const options = [{ id: 'A', text: '3 m/s', isCorrect: true }, { id: 'B', text: '1 m/s', isCorrect: false },
  { id: 'C', text: '2 m/s', isCorrect: false }, { id: 'D', text: '4 m/s', isCorrect: false }, { id: 'E', text: '5 m/s', isCorrect: false }]

beforeAll(async () => {
  await truncateUserData()
  const auth = await registerAndLogin('media_flow')
  token = auth.token
  userId = auth.userId
  const exam = await testPrisma.vestibular.create({ data: {
    slug, name: 'Prova de teste visual', institution: 'Teste', state: 'BR', year: 2026, description: 'Fixture isolada',
    subjects: { create: { name: 'Física', slug: 'fisica', weight: 1, order: 1, iconSlug: 'science',
      topics: { create: { name: 'Fixture visual', description: 'Teste de mídia', order: 1 } } } },
  }, include: { subjects: { include: { topics: true } } } })
  examId = exam.id
  topicId = exam.subjects[0]!.topics[0]!.id
  expect((await api.post('/api/v1/enrollments').set('Authorization', `Bearer ${token}`).send({ vestibularId: examId })).status).toBe(201)
})
afterAll(async () => {
  await testPrisma.indexSnapshot.deleteMany({ where: { vestibularId: examId } })
  await testPrisma.simuladoAttempt.deleteMany({ where: { vestibularId: examId } })
  await testPrisma.userAnswer.deleteMany({ where: { question: { topicId } } })
  await testPrisma.question.deleteMany({ where: { topicId } })
  await testPrisma.quizSession.deleteMany({ where: { topicId } })
  await testPrisma.userTopicProgress.deleteMany({ where: { topicId } })
  await testPrisma.topic.deleteMany({ where: { subject: { vestibularId: examId } } })
  await testPrisma.subject.deleteMany({ where: { vestibularId: examId } })
  await testPrisma.enrollment.deleteMany({ where: { vestibularId: examId } })
  await testPrisma.vestibular.delete({ where: { id: examId } })
  await testPrisma.$disconnect()
})

describe('figures from storage to active questions and review', () => {
  it('keeps media and alt text in the quiz and its saved summary', async () => {
    const session = await testPrisma.quizSession.create({ data: { userId, topicId } })
    await testPrisma.question.create({ data: { topicId, generatedForSessionId: session.id,
      body: 'Observe a figura e identifique a velocidade.', options, explanation: 'A distância varia três metros por segundo.', difficulty: 1,
      imageUrl: '/question-media/cadeia-alimentar.svg', media: { imageAlt: 'Figura de teste', imageCaption: 'Legenda de teste', visual } } })
    const active = await api.get(`/api/v1/quiz/${session.id}`).set('Authorization', `Bearer ${token}`)
    expect(active.status).toBe(200)
    expect(active.body.questions[0]).toMatchObject({ imageUrl: '/question-media/cadeia-alimentar.svg', imageAlt: 'Figura de teste', visual })
    expect(active.body.questions[0].options.every((option: object) => !('isCorrect' in option))).toBe(true)
    const finished = await api.post(`/api/v1/quiz/${session.id}/finish`).set('Authorization', `Bearer ${token}`)
    expect(finished.status).toBe(200)
    expect(finished.body.questions[0].visual).toEqual(visual)
    const restored = await api.get(`/api/v1/quiz/${session.id}/summary`).set('Authorization', `Bearer ${token}`)
    expect(restored.body.questions[0].imageAlt).toBe('Figura de teste')
  })
  it('snapshots bank media into the simulado and retains it after finishing', async () => {
    await testPrisma.question.createMany({ data: Array.from({ length: 45 }, (_, index) => ({
      topicId, body: `Questão visual de teste ${index}: qual é a velocidade?`, options, explanation: 'A velocidade é três metros por segundo.',
      difficulty: 1, source: 'CURATED' as const, imageUrl: '/question-media/cadeia-alimentar.svg', media: { imageAlt: 'Figura de teste', visual },
    })) })
    const start = await api.post(`/api/v1/simulado/${slug}/start`).set('Authorization', `Bearer ${token}`)
    expect(start.status).toBe(200)
    expect(start.body.questions).toHaveLength(45)
    expect(start.body.questions[0]).toMatchObject({ imageAlt: 'Figura de teste', visual })
    expect(start.body.questions[0].options.every((option: object) => !('isCorrect' in option))).toBe(true)
    const id = start.body.id as string
    expect((await api.post(`/api/v1/simulado/attempt/${id}/finish`).set('Authorization', `Bearer ${token}`)).status).toBe(200)
    const review = await api.get(`/api/v1/simulado/attempt/${id}`).set('Authorization', `Bearer ${token}`)
    expect(review.body.questions[0]).toMatchObject({ imageUrl: '/question-media/cadeia-alimentar.svg', visual })
    expect(review.body.questions[0].correctOptionId).toBeTruthy()
  })
})
