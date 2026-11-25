import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('../lib/gemini', () => ({ ai: { models: { generateContent: vi.fn() } } }))
import { execFileSync } from 'node:child_process'
import { ai } from '../lib/gemini'
import { env } from '../lib/env'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'

const generateContent = vi.mocked(ai.models.generateContent)
type GenResponse = Awaited<ReturnType<typeof ai.models.generateContent>>
const originalKey = env.GEMINI_API_KEY
const EXPLANATION = 'O texto defende a tese apresentada no primeiro parágrafo; por isso a alternativa correta retoma essa ideia central.'

beforeAll(() => { env.GEMINI_API_KEY = 'mock-official-key' })
afterAll(async () => { env.GEMINI_API_KEY = originalKey })
beforeEach(async () => { await truncateUserData(); generateContent.mockReset() })

async function topicByName(name: string) {
  return testPrisma.topic.findFirstOrThrow({ where: { name, subject: { vestibular: { slug: 'enem' } } } })
}
async function seedOfficial(topicName: string, n: number, prefix = 'cofenem2020q') {
  const topic = await topicByName(topicName)
  for (let i = 1; i <= n; i++) {
    await testPrisma.question.create({ data: {
      id: `${prefix}${String(i).padStart(3, '0')}`, topicId: topic.id, source: 'OFFICIAL', year: 2020, origin: `ENEM 2020 · questão ${i}`,
      body: `Texto oficial ${prefix} número ${i}. Qual é a ideia central?`, explanation: '', difficulty: 3,
      options: ['A', 'B', 'C', 'D', 'E'].map((id) => ({ id, text: `Alternativa ${id} da questão ${i}`, isCorrect: id === 'C' })),
    } })
  }
  return topic
}
async function student(suffix: string, topicId: string) {
  const s = await registerAndLogin(suffix)
  await testPrisma.user.update({ where: { id: s.userId }, data: { plan: 'PLUS', planExpiresAt: null } })
  const exam = await testPrisma.vestibular.findUniqueOrThrow({ where: { slug: 'enem' } })
  await api.post('/api/v1/enrollments').set('Authorization', `Bearer ${s.token}`).send({ vestibularId: exam.id })
  await testPrisma.userTopicProgress.upsert({ where: { userId_topicId: { userId: s.userId, topicId } }, update: { unlocked: true }, create: { userId: s.userId, topicId, unlocked: true } })
  return s
}
const practise = async (token: string, topicId: string, count = 3) => {
  const created = await api.post('/api/v1/quiz/generate').set('Authorization', `Bearer ${token}`).send({ topicId, count })
  expect(created.status).toBe(201)
  const session = await api.get(`/api/v1/quiz/${created.body.sessionId}`).set('Authorization', `Bearer ${token}`)
  return session.body
}

describe('banco de questões oficiais', () => {
  it('a prática usa questões reais do ENEM, na ordem da prova e com a referência visível, sem chamar a IA para gerar', async () => {
    const topic = await seedOfficial('Interpretação de Texto', 6)
    const s = await student('off_practice', topic.id)
    const session = await practise(s.token, topic.id)
    expect(session.generation).toMatchObject({ source: 'OFFICIAL' })
    expect(session.questions).toHaveLength(3)
    expect(session.questions[0].origin).toMatch(/^ENEM 2020 · questão \d$/)
    expect(session.questions[0].options.map((o: { id: string }) => o.id)).toEqual(['A', 'B', 'C', 'D', 'E'])
    const copies = await testPrisma.question.findMany({ where: { generatedForSessionId: session.sessionId } })
    expect(copies.every((q) => q.source === 'OFFICIAL' && q.officialRefId?.startsWith('cofenem2020q'))).toBe(true)
  })

  it('erro em questão oficial traz explicação escrita por IA uma vez, guardada para o próximo aluno', async () => {
    generateContent.mockResolvedValue({ text: EXPLANATION } as GenResponse)
    const topic = await seedOfficial('Interpretação de Texto', 3)
    const a = await student('off_expl_a', topic.id)
    const first = await practise(a.token, topic.id)
    await new Promise((r) => setTimeout(r, 300)) // prefetch em segundo plano
    const q = first.questions[0]
    const res = await api.post(`/api/v1/quiz/${first.sessionId}/answer`).set('Authorization', `Bearer ${a.token}`).send({ questionId: q.id, optionId: 'A', timeSpentMs: 5000 })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ isCorrect: false, correctOptionId: 'C', explanation: EXPLANATION, explanationByAi: true })
    expect(res.body.origin).toMatch(/^ENEM 2020/)
    const calls = generateContent.mock.calls.length
    expect(calls).toBe(3) // uma por questão oficial, nunca repetida
    const canonical = await testPrisma.question.findMany({ where: { source: 'OFFICIAL', generatedForSessionId: null } })
    expect(canonical.every((c) => c.explanation === EXPLANATION && c.explanationByAi)).toBe(true)
    const b = await student('off_expl_b', topic.id)
    const second = await practise(b.token, topic.id)
    const resB = await api.post(`/api/v1/quiz/${second.sessionId}/answer`).set('Authorization', `Bearer ${b.token}`).send({ questionId: second.questions[0].id, optionId: 'C', timeSpentMs: 3000 })
    expect(resB.body.explanation).toBe(EXPLANATION)
    expect(generateContent.mock.calls.length).toBe(calls)
  })

  it('sem IA disponível, a resposta informa o gabarito oficial em vez de ficar vazia', async () => {
    generateContent.mockRejectedValue(new Error('503 UNAVAILABLE'))
    const topic = await seedOfficial('Interpretação de Texto', 3)
    const s = await student('off_noai', topic.id)
    const session = await practise(s.token, topic.id)
    const res = await api.post(`/api/v1/quiz/${session.sessionId}/answer`).set('Authorization', `Bearer ${s.token}`).send({ questionId: session.questions[0].id, optionId: 'B', timeSpentMs: 1000 })
    expect(res.body.explanation).toMatch(/^Gabarito oficial: alternativa C\./)
  })

  it('não repete questão oficial já vista; sem questões novas, cai para o acervo', async () => {
    const topic = await seedOfficial('Interpretação de Texto', 4)
    const s = await student('off_repeat', topic.id)
    const first = await practise(s.token, topic.id)
    const second = await practise(s.token, topic.id)
    const refs = async (sessionId: string) => (await testPrisma.question.findMany({ where: { generatedForSessionId: sessionId } })).map((q) => q.officialRefId)
    expect(second.generation.source).not.toBe('OFFICIAL') // só 1 inédita (< 3): usa o acervo
    const firstRefs = await refs(first.sessionId)
    expect(new Set(firstRefs).size).toBe(3)
  })

  it('tópico integrador usa as questões dos tópicos específicos equivalentes', async () => {
    await seedOfficial('Ética, Liberdade e Estética', 3, 'cofenem2021q')
    const topic = await topicByName('Filosofia e Sociologia')
    const s = await student('off_sibling', topic.id)
    const session = await practise(s.token, topic.id)
    expect(session.generation.source).toBe('OFFICIAL')
    expect(session.questions[0].origin).toMatch(/^ENEM 2020/)
  })

  it('importador carrega o banco real, é idempotente e nunca apaga explicação existente', async () => {
    const run = () => execFileSync('node', ['scripts/import-official.mjs'], { env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL }, encoding: 'utf8' })
    expect(run()).toMatch(/\[official\] enem: \d+ novas/)
    const total = await testPrisma.question.count({ where: { source: 'OFFICIAL' } })
    expect(total).toBeGreaterThan(1500)
    const one = await testPrisma.question.findFirstOrThrow({ where: { source: 'OFFICIAL' } })
    await testPrisma.question.update({ where: { id: one.id }, data: { explanation: 'Explicação revisada.', explanationByAi: false } })
    expect(run()).toMatch(/0 novas, 0 atualizadas, \d+ no arquivo, 0 explicações refeitas/)
    expect((await testPrisma.question.findUniqueOrThrow({ where: { id: one.id } })).explanation).toBe('Explicação revisada.')
    expect(await testPrisma.question.count({ where: { source: 'OFFICIAL' } })).toBe(total)
  }, 60_000)
})

describe('tom da explicação', () => {
  it('remove saudação informal do início', async () => {
    const { stripGreeting } = await import('../modules/quiz/official')
    expect(stripGreeting('Fala, moçada! Salve para a rede pública! O texto destaca que a linotipo barateou a produção.')).toBe('O texto destaca que a linotipo barateou a produção.')
    expect(stripGreeting('O fator decisivo é a densidade.')).toBe('O fator decisivo é a densidade.')
  })
})
