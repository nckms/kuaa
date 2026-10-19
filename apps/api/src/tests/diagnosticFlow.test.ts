import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'
import { initialDifficulty } from '../modules/diagnostic/diagnostic.engine'

beforeAll(truncateUserData)
afterAll(() => testPrisma.$disconnect())

describe('diagnostico inicial', () => {
  it('persiste perfil e 12 respostas, sem vazar gabarito, e influencia a trilha', async () => {
    const auth = await registerAndLogin('diagnostic_flow')
    const authorization = `Bearer ${auth.token}`
    const exam = await testPrisma.vestibular.findUniqueOrThrow({ where: { slug: 'enem' } })
    await api.post('/api/v1/enrollments').set('Authorization', authorization).send({ vestibularId: exam.id })
    const path = '/api/v1/diagnostic/enem'
    const initial = await api.get(path).set('Authorization', authorization)
    expect(initial.body.status).toBe('profile')
    const subject = initial.body.subjects.find((item: { name: string }) => item.name === 'Matemática')
    const profile = { schoolStage: 'medio', examHorizon: 'este-ano', weeklyMinutes: 180, difficultSubjects: [subject.id] }
    const created = await api.post(`${path}/profile`).set('Authorization', authorization).send(profile)
    expect(created.status).toBe(200)
    expect(created.body.status).toBe('questions')
    expect((await api.get(path).set('Authorization', authorization)).body.question.id).toBe(created.body.question.id)
    let state = created.body
    for (let index = 0; index < 12; index++) {
      const question = state.question
      expect(question.options.every((option: object) => !('isCorrect' in option))).toBe(true)
      const answer = { questionId: question.id, optionId: index % 4 === 0 ? null : question.options[0].id }
      const response = await api.post(`${path}/answer`).set('Authorization', authorization).send(answer)
      expect(response.status).toBe(200)
      state = response.body
      expect(state.answered).toBe(index + 1)
      if (index === 0) {
        const repeat = await api.post(`${path}/answer`).set('Authorization', authorization).send(answer)
        expect(repeat.body.answered).toBe(1)
      }
    }
    expect(state.status).toBe('completed')
    expect(state.result.areas).toHaveLength(4)
    expect(state.result.areas.map((area: { answered: number }) => area.answered)).toEqual([3, 3, 3, 3])
    expect(state.result.recommendedMinutes).toBe(36)
    const record = await testPrisma.enrollment.findUniqueOrThrow({ where: { userId_vestibularId: { userId: auth.userId, vestibularId: exam.id } } })
    expect(initialDifficulty(record.diagnostic, subject.id)).toBeGreaterThanOrEqual(1)
    const trail = await api.get('/api/v1/trail/enem').set('Authorization', authorization)
    expect(trail.status).toBe(200)
    expect(trail.body.recommendation.reason).toContain('diagnostico')
    expect((await api.get(path).set('Authorization', authorization)).body.status).toBe('completed')
  })
  it('usa um resultado forte para aumentar a dificuldade da primeira pratica', async () => {
    const auth = await registerAndLogin('diagnostic_strong')
    const authorization = `Bearer ${auth.token}`
    const exam = await testPrisma.vestibular.findUniqueOrThrow({ where: { slug: 'enem' } })
    await api.post('/api/v1/enrollments').set('Authorization', authorization).send({ vestibularId: exam.id })
    const path = '/api/v1/diagnostic/enem'
    let state = (await api.post(`${path}/profile`).set('Authorization', authorization).send({
      schoolStage: 'concluido', examHorizon: 'este-ano', weeklyMinutes: 300, difficultSubjects: [],
    })).body
    for (let index = 0; index < 12; index++) {
      const record = await testPrisma.enrollment.findUniqueOrThrow({ where: { userId_vestibularId: { userId: auth.userId, vestibularId: exam.id } } })
      const pool = (record.diagnostic as { pool: { id: string; options: { id: string; isCorrect: boolean }[] }[] }).pool
      const correct = pool.find((question) => question.id === state.question.id)!.options.find((option) => option.isCorrect)!
      state = (await api.post(`${path}/answer`).set('Authorization', authorization).send({ questionId: state.question.id, optionId: correct.id })).body
    }
    expect(state.result.areas.every((area: { targetDifficulty: number }) => area.targetDifficulty >= 2)).toBe(true)
    const trail = (await api.get('/api/v1/trail/enem').set('Authorization', authorization)).body
    expect(trail.recommendation.targetDifficulty).toBeGreaterThanOrEqual(2)
    const generated = await api.post('/api/v1/quiz/generate').set('Authorization', authorization).send({ topicId: trail.recommendation.topicId, count: 3 })
    expect(generated.status).toBe(201)
    const session = await testPrisma.quizSession.findUniqueOrThrow({ where: { id: generated.body.sessionId } })
    expect((session.generationMetadata as { targetDifficulty: number }).targetDifficulty).toBeGreaterThanOrEqual(2)
  })
})
