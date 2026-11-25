import { beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('../lib/gemini', () => ({ ai: { models: { generateContent: vi.fn() } } }))
import { ai } from '../lib/gemini'
import { env } from '../lib/env'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'
import { acceptedOptionIds } from '../modules/exams/exams'

const generateContent = vi.mocked(ai.models.generateContent)
type GenResponse = Awaited<ReturnType<typeof ai.models.generateContent>>

async function seedExam(year: number) {
  const topic = await testPrisma.topic.findFirstOrThrow({ where: { name: 'Interpretação de Texto', subject: { vestibular: { slug: 'enem' } } } })
  const ids = ['q001ing', 'q001esp', 'q002ing', 'q002esp', ...Array.from({ length: 12 }, (_, i) => `q${String(i + 6).padStart(3, '0')}`),
    ...Array.from({ length: 12 }, (_, i) => `q${String(i + 91).padStart(3, '0')}`)]
  for (const suffix of ids) {
    await testPrisma.question.create({ data: {
      id: `cofenem${year}${suffix}`, topicId: topic.id, source: 'OFFICIAL', year, origin: `ENEM ${year} · ${suffix}`,
      body: `Enunciado ${year} ${suffix}`, explanation: '', difficulty: 3,
      options: ['A', 'B', 'C', 'D', 'E'].map((id) => ({ id, text: `Opção ${id}`, isCorrect: id === 'B' })),
    } })
  }
}

beforeEach(async () => { await truncateUserData(); generateContent.mockReset() })

describe('provas anteriores (ENEM completo)', () => {
  it('tempo e áreas oficiais de cada ano (até 2016 a ordem era outra)', async () => {
    const { enemArea, enemDuration } = await import('../modules/exams/exams')
    expect([enemArea(2022, 1), enemDuration(2022, 1), enemDuration(2022, 2)]).toEqual(['Linguagens e Ciências Humanas', 19800, 18000])
    expect([enemArea(2015, 1), enemArea(2015, 2), enemDuration(2015, 1), enemDuration(2015, 2)]).toEqual(['Ciências Humanas e Ciências da Natureza', 'Linguagens e Matemática', 16200, 19800])
    expect(enemArea(2009, 1)).toBe('Ciências da Natureza e Ciências Humanas')
  })

  it('lista anos e dias com quantidade de questões', async () => {
    await seedExam(2022)
    const s = await registerAndLogin('exam_list')
    const res = await api.get('/api/v1/exams/enem').set('Authorization', `Bearer ${s.token}`)
    expect(res.body.exams).toEqual([
      expect.objectContaining({ year: 2022, day: 1, questions: 14, durationSeconds: 19800, attempts: 0, last: null }),
      expect.objectContaining({ year: 2022, day: 2, questions: 12, durationSeconds: 18000 }),
    ])
  })

  it('prova na ordem oficial, no idioma do aluno, sem gabarito até entregar; correção e explicação sob demanda', async () => {
    await seedExam(2021)
    const s = await registerAndLogin('exam_flow')
    await testPrisma.user.update({ where: { id: s.userId }, data: { preferences: { enemLanguage: 'espanhol' } } })
    const start = await api.post('/api/v1/exams/enem/2021/1/start').set('Authorization', `Bearer ${s.token}`)
    expect(start.status).toBe(201)
    const again = await api.post('/api/v1/exams/enem/2021/1/start').set('Authorization', `Bearer ${s.token}`)
    expect(again.body.id).toBe(start.body.id) // continua a mesma prova aberta
    const attempt = (await api.get(`/api/v1/exams/attempts/${start.body.id}`).set('Authorization', `Bearer ${s.token}`)).body
    expect(attempt.questions.map((q: { id: string }) => q.id).slice(0, 3)).toEqual(['cofenem2021q001esp', 'cofenem2021q002esp', 'cofenem2021q006'])
    expect(attempt.questions).toHaveLength(14)
    expect(attempt.questions[0]).not.toHaveProperty('correctOptionId')
    expect(JSON.stringify(attempt)).not.toContain('isCorrect')
    const answer = (questionId: string, optionId: string) => api.patch(`/api/v1/exams/attempts/${start.body.id}/answer`).set('Authorization', `Bearer ${s.token}`).send({ questionId, optionId })
    expect((await answer('cofenem2021q001esp', 'B')).status).toBe(200)
    expect((await answer('cofenem2021q006', 'C')).status).toBe(200)
    expect((await answer('cofenem2021q001ing', 'B')).status).toBe(400) // fora da prova
    expect((await api.patch(`/api/v1/exams/attempts/${start.body.id}/flag`).set('Authorization', `Bearer ${s.token}`).send({ questionId: 'cofenem2021q007' })).body.flagged).toEqual(['cofenem2021q007'])
    const done = await api.post(`/api/v1/exams/attempts/${start.body.id}/finish`).set('Authorization', `Bearer ${s.token}`)
    expect(done.body).toMatchObject({ correct: 1, wrong: 1, total: 14 })
    expect((await answer('cofenem2021q007', 'A')).status).toBe(409)
    const review = (await api.get(`/api/v1/exams/attempts/${start.body.id}`).set('Authorization', `Bearer ${s.token}`)).body
    expect(review.questions[0]).toMatchObject({ correctOptionId: 'B', explanation: null })
    const prev = env.GEMINI_API_KEY
    env.GEMINI_API_KEY = 'mock'
    generateContent.mockResolvedValue({ text: 'A alternativa B retoma a ideia central do texto, como pede o enunciado.' } as GenResponse)
    try {
      const exp = await api.get(`/api/v1/exams/attempts/${start.body.id}/questions/cofenem2021q006/explanation`).set('Authorization', `Bearer ${s.token}`)
      expect(exp.body).toEqual({ explanation: 'A alternativa B retoma a ideia central do texto, como pede o enunciado.', explanationByAi: true })
    } finally { env.GEMINI_API_KEY = prev }
    const list = (await api.get('/api/v1/exams/enem').set('Authorization', `Bearer ${s.token}`)).body.exams
    expect(list.find((e: { day: number }) => e.day === 1).last).toMatchObject({ finished: true, correct: 1, total: 14 })
  })

  it('tempo esgotado entrega a prova sozinha; prova de outro aluno é inacessível', async () => {
    await seedExam(2020)
    const s = await registerAndLogin('exam_time')
    const other = await registerAndLogin('exam_other')
    const start = await api.post('/api/v1/exams/enem/2020/2/start').set('Authorization', `Bearer ${s.token}`)
    expect((await api.get(`/api/v1/exams/attempts/${start.body.id}`).set('Authorization', `Bearer ${other.token}`)).status).toBe(404)
    await testPrisma.examAttempt.update({ where: { id: start.body.id }, data: { startedAt: new Date(Date.now() - 6 * 3600_000) } })
    const res = (await api.get(`/api/v1/exams/attempts/${start.body.id}`).set('Authorization', `Bearer ${s.token}`)).body
    expect(res.finishedAt).not.toBeNull()
    expect(res.correct).toBe(0)
    expect((await api.post('/api/v1/exams/enem/2019/1/start').set('Authorization', `Bearer ${s.token}`)).status).toBe(404)
  })
})

describe('alternativa correta repetida na transcrição', () => {
  it('aceita qualquer alternativa com o mesmo texto do gabarito', () => {
    const options = [
      { id: 'A', text: 'A,E,O e S.', isCorrect: false }, { id: 'B', text: 'D, E, F e G.', isCorrect: false },
      { id: 'C', text: 'D, E, F  e G.', isCorrect: true }, { id: 'D', text: 'D,H,R e V.', isCorrect: false },
      { id: 'E', text: 'X, B L e P.', isCorrect: false },
    ]
    expect(acceptedOptionIds(options)).toEqual(['B', 'C'])
    expect(acceptedOptionIds(options.map((o) => ({ ...o, text: `${o.id} único` })))).toEqual(['C'])
  })
})
