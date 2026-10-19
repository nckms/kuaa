import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'

beforeAll(truncateUserData)
afterAll(() => testPrisma.$disconnect())

describe('material de estudo', () => {
  it('exige autenticacao e matricula, e disponibiliza aula apenas onde ha conteudo editorial', async () => {
    const exam = await testPrisma.vestibular.findUniqueOrThrow({ where: { slug: 'enem' },
      include: { subjects: { include: { topics: true } } } })
    const topic = exam.subjects.flatMap((subject) => subject.topics).find((item) => item.name === 'Interpretação de Texto')!
    const unavailable = exam.subjects.flatMap((subject) => subject.topics).find((item) => item.name === 'Literatura Brasileira')!
    const path = `/api/v1/study/topics/${topic.id}`
    expect((await api.get(path)).status).toBe(401)
    const auth = await registerAndLogin('study_access')
    const authorization = `Bearer ${auth.token}`
    expect((await api.get(path).set('Authorization', authorization)).status).toBe(403)
    await api.post('/api/v1/enrollments').set('Authorization', authorization).send({ vestibularId: exam.id })
    const lesson = await api.get(path).set('Authorization', authorization)
    expect(lesson.status).toBe(200)
    expect(lesson.body.guide.example.steps.length).toBeGreaterThan(0)
    expect(lesson.body.guide.check.options[lesson.body.guide.check.correctIndex]).toBeTruthy()
    expect(lesson.body.mistakes).toEqual([])
    expect((await api.get(`/api/v1/study/topics/${unavailable.id}`).set('Authorization', authorization)).status).toBe(404)
    const trail = await api.get('/api/v1/trail/enem').set('Authorization', authorization)
    const topics = trail.body.subjects.flatMap((subject: { topics: Array<{ id: string; guideAvailable: boolean }> }) => subject.topics)
    expect(topics.find((item: { id: string }) => item.id === topic.id).guideAvailable).toBe(true)
    expect(topics.find((item: { id: string }) => item.id === unavailable.id).guideAvailable).toBe(false)
  })

  it('mostra apenas os erros recentes do proprio aluno naquele topico', async () => {
    const exam = await testPrisma.vestibular.findUniqueOrThrow({ where: { slug: 'enem' },
      include: { subjects: { include: { topics: true } } } })
    const topic = exam.subjects.flatMap((subject) => subject.topics).find((item) => item.name === 'Interpretação de Texto')!
    const first = await registerAndLogin('study_first')
    const second = await registerAndLogin('study_second')
    for (const user of [first, second]) {
      await api.post('/api/v1/enrollments').set('Authorization', `Bearer ${user.token}`).send({ vestibularId: exam.id })
    }
    const session = await testPrisma.quizSession.create({ data: { userId: first.userId, topicId: topic.id } })
    const question = await testPrisma.question.create({ data: { topicId: topic.id, body: 'Pergunta de teste de interpretação',
      explanation: 'Retome a relação de contraste no trecho.', difficulty: 1,
      options: [{ id: 'A', text: 'Errada', isCorrect: false }, { id: 'B', text: 'Certa', isCorrect: true }] } })
    await testPrisma.userAnswer.create({ data: { userId: first.userId, sessionId: session.id,
      questionId: question.id, optionId: 'A', isCorrect: false, timeSpentMs: 5000 } })
    const path = `/api/v1/study/topics/${topic.id}`
    const own = await api.get(path).set('Authorization', `Bearer ${first.token}`)
    const other = await api.get(path).set('Authorization', `Bearer ${second.token}`)
    expect(own.body.mistakes).toHaveLength(1)
    expect(own.body.mistakes[0].explanation).toContain('contraste')
    expect(other.body.mistakes).toEqual([])
  })
})
