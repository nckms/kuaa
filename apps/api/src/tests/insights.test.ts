import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('../lib/gemini', () => ({ ai: { models: { generateContent: vi.fn() } } }))
import { ai } from '../lib/gemini'
import { env } from '../lib/env'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'
import { inferReason } from '../modules/review/insights'

const generate = vi.mocked(ai.models.generateContent)
type GenResponse = Awaited<ReturnType<typeof ai.models.generateContent>>
const originalKey = env.GEMINI_API_KEY
beforeEach(async () => { await truncateUserData(); generate.mockReset(); env.GEMINI_API_KEY = 'mock-key' })
afterAll(async () => { env.GEMINI_API_KEY = originalKey; await testPrisma.$disconnect() })

async function seed(userId: string, items: Array<{ ok: boolean; ms: number; subject?: string }>) {
  const topics = await testPrisma.topic.findMany({ where: { subject: { vestibular: { slug: 'enem' } } }, include: { subject: true }, take: 400 })
  const pick = (subject?: string) => topics.find((t) => !subject || t.subject.name === subject) ?? topics[0]!
  const ids: Array<{ sessionId: string; questionId: string }> = []
  for (const it of items) {
    const topic = pick(it.subject)
    const session = await testPrisma.quizSession.create({ data: { userId, topicId: topic.id } })
    const q = await testPrisma.question.create({ data: { topicId: topic.id, generatedForSessionId: session.id, body: 'Q', explanation: 'x', difficulty: 2,
      options: [{ id: 'A', text: 'a', isCorrect: true }, { id: 'B', text: 'b', isCorrect: false }] } })
    await testPrisma.userAnswer.create({ data: { userId, questionId: q.id, sessionId: session.id, optionId: it.ok ? 'A' : 'B', isCorrect: it.ok, timeSpentMs: it.ms } })
    ids.push({ sessionId: session.id, questionId: q.id })
  }
  return ids
}

describe('Raio-X dos erros', () => {
  it('motivo: o do aluno vale; sem motivo e rápido conta como pressa', () => {
    expect(inferReason({ mistakeReason: 'conta', timeSpentMs: 5000 })).toBe('conta')
    expect(inferReason({ mistakeReason: null, timeSpentMs: 5000 })).toBe('tempo')
    expect(inferReason({ mistakeReason: null, timeSpentMs: 90_000 })).toBe('sem-motivo')
  })

  it('aluno registra o motivo só em resposta errada dele', async () => {
    const s = await registerAndLogin('insight_reason')
    const other = await registerAndLogin('insight_other')
    const [wrong, right] = await seed(s.userId, [{ ok: false, ms: 60_000 }, { ok: true, ms: 60_000 }])
    const path = (x: { sessionId: string; questionId: string }) => `/api/v1/insights/answers/${x.sessionId}/${x.questionId}/reason`
    expect((await api.patch(path(wrong!)).set('Authorization', `Bearer ${s.token}`).send({ reason: 'leitura' })).status).toBe(204)
    expect((await api.patch(path(right!)).set('Authorization', `Bearer ${s.token}`).send({ reason: 'leitura' })).status).toBe(404)
    expect((await api.patch(path(wrong!)).set('Authorization', `Bearer ${other.token}`).send({ reason: 'leitura' })).status).toBe(404)
    expect((await api.patch(path(wrong!)).set('Authorization', `Bearer ${s.token}`).send({ reason: 'outro' })).status).toBe(400)
    expect((await testPrisma.userAnswer.findFirstOrThrow({ where: { questionId: wrong!.questionId } })).mistakeReason).toBe('leitura')
  })

  it('gratuito vê o convite; Plus vê o padrão, as matérias e as ações da semana', async () => {
    const s = await registerAndLogin('insight_plus')
    const ids = await seed(s.userId, [
      ...Array.from({ length: 4 }, () => ({ ok: false, ms: 70_000 })), { ok: false, ms: 5000 }, { ok: false, ms: 6000 }, { ok: true, ms: 40_000 },
    ])
    for (const x of ids.slice(0, 3)) await testPrisma.userAnswer.updateMany({ where: { questionId: x.questionId }, data: { mistakeReason: 'leitura' } })
    const free = await api.get('/api/v1/insights/mistakes').set('Authorization', `Bearer ${s.token}`)
    expect(free.status).toBe(402)
    expect(free.body.teaser).toMatchObject({ wrong: 6 })
    await testPrisma.user.update({ where: { id: s.userId }, data: { plan: 'PLUS', planExpiresAt: null } })
    generate.mockResolvedValueOnce({ text: JSON.stringify({ actions: ['Leia o comando da questão duas vezes antes das alternativas, em 10 questões por dia.'] }) } as GenResponse)
    const plus = await api.get('/api/v1/insights/mistakes').set('Authorization', `Bearer ${s.token}`)
    expect(plus.status).toBe(200)
    expect(plus.body).toMatchObject({ wrong: 6, answered: 7, dominant: 'leitura', fastWrong: 2 })
    expect(plus.body.reasons[0]).toMatchObject({ reason: 'leitura', count: 3 })
    expect(plus.body.actions).toHaveLength(1)
  })
})
