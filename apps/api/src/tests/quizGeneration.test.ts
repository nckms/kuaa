import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('../lib/gemini', () => ({ ai: { models: { generateContent: vi.fn() } } }))
import { ai } from '../lib/gemini'
import { env } from '../lib/env'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'

const generateContent = vi.mocked(ai.models.generateContent)
let token: string
let topicId: string
const originalKey = env.GEMINI_API_KEY

beforeAll(async () => {
  await truncateUserData()
  token = (await registerAndLogin('generation')).token
  const exam = await testPrisma.vestibular.findUniqueOrThrow({ where: { slug: 'unicamp' } })
  await api.post('/api/v1/enrollments').set('Authorization', `Bearer ${token}`).send({ vestibularId: exam.id })
  const trail = await api.get('/api/v1/trail/unicamp').set('Authorization', `Bearer ${token}`)
  topicId = trail.body.subjects[0].topics[0].id
  env.GEMINI_API_KEY = 'mock-generation-key'
})
afterAll(async () => { env.GEMINI_API_KEY = originalKey; await testPrisma.$disconnect() })

const start = () => api.post('/api/v1/quiz/generate').set('Authorization', `Bearer ${token}`).send({ topicId, count: 3 })

describe('few-shot integrado ao quiz (provedor simulado)', () => {
  it('envia exemplos, valida e grava origem IA sem vazar o gabarito', async () => {
    const questions = Array.from({ length: 3 }, (_, index) => ({
      body: `Qual e o dobro do numero ${index + 3}?`,
      options: [2, 4, 6, 8].map((offset, i) => ({ id: 'ABCD'[i], text: String(index * 2 + offset), isCorrect: i === 2 })),
      explanation: 'Multiplicar o numero apresentado por dois fornece o dobro solicitado.', difficulty: 1,
    }))
    generateContent.mockResolvedValueOnce({ text: JSON.stringify({ questions }) } as Awaited<ReturnType<typeof ai.models.generateContent>>)
    const created = await start()
    expect(created.status).toBe(201)
    const prompt = String(generateContent.mock.calls[0][0].contents)
    expect(prompt).toContain('REFERENCIAS DIDATICAS ADAPTADAS')
    expect(prompt).toContain('unicamp')
    const session = await api.get(`/api/v1/quiz/${created.body.sessionId}`).set('Authorization', `Bearer ${token}`)
    expect(session.body.generation).toMatchObject({ source: 'AI_GENERATED', promptVersion: 'few-shot-v1' })
    expect(session.body.generation.referenceIds).toHaveLength(2)
    expect(session.body.questions.every((q: { options: object[] }) => q.options.length === 4 && q.options.every((o) => !('isCorrect' in o)))).toBe(true)
    const stored = await testPrisma.question.findMany({ where: { generatedForSessionId: created.body.sessionId } })
    expect(stored.every((q) => q.source === 'AI_GENERATED')).toBe(true)
  })
  it('resposta IA invalida usa reserva identificada, nunca origem IA', async () => {
    generateContent.mockResolvedValueOnce({ text: '{"questions":[]}' } as Awaited<ReturnType<typeof ai.models.generateContent>>)
    const created = await start()
    expect(created.status).toBe(201)
    const session = await api.get(`/api/v1/quiz/${created.body.sessionId}`).set('Authorization', `Bearer ${token}`)
    expect(session.body.generation.source).toBe('CURATED')
    expect(session.body.questions).toHaveLength(3)
    expect(session.body.questions.every((q: { options: unknown[] }) => q.options.length === 4)).toBe(true)
  })
  it('nao revela status da sessao de outro usuario', async () => {
    generateContent.mockRejectedValueOnce(new Error('provider unavailable'))
    const created = await start()
    const other = await registerAndLogin('generation_other')
    const status = await api.get(`/api/v1/quiz/job/${created.body.jobId}?sessionId=${created.body.sessionId}`).set('Authorization', `Bearer ${other.token}`)
    expect(status.status).toBe(404)
  })
  it('retoma somente a sessao aberta do proprio usuario', async () => {
    const resumed = await api.get(`/api/v1/quiz/topic/${topicId}/resume`).set('Authorization', `Bearer ${token}`)
    expect(resumed.status).toBe(200)
    expect(resumed.body.sessionId).toBeTruthy()
    const other = await registerAndLogin('resume_other')
    const privateSession = await api.get(`/api/v1/quiz/topic/${topicId}/resume`).set('Authorization', `Bearer ${other.token}`)
    expect(privateSession.body).toBeNull()
    await testPrisma.quizSession.updateMany({ where: { id: resumed.body.sessionId }, data: { finishedAt: new Date() } })
    const next = await api.get(`/api/v1/quiz/topic/${topicId}/resume`).set('Authorization', `Bearer ${token}`)
    expect(next.body?.sessionId).not.toBe(resumed.body.sessionId)
  })
})
