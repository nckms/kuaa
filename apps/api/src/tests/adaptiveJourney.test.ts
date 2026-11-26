/**
 * Jornada adaptativa de ponta a ponta, só pelos endpoints que o aluno usa.
 *
 * O que este arquivo COMPROVA:
 *  - o diagnóstico inicial define a dificuldade da primeira prática;
 *  - poucas respostas não alteram o domínio, mas ficam guardadas como evidência;
 *  - evidência suficiente com acertos avança o domínio;
 *  - erros recorrentes geram reforço e reduzem a dificuldade alvo;
 *  - o progresso persiste entre logins;
 *  - a dificuldade calculada pelas regras é a mesma que chega ao prompt da IA
 *    e a mesma gravada nos metadados da sessão;
 *  - a origem de cada questão (IA x reserva curada) é registrada e exposta.
 *
 * O que este arquivo NÃO comprova: que o Gemini esteja disponível ou que suas
 * questões sejam pedagogicamente corretas. O provedor é substituído por um mock
 * determinístico; disponibilidade real só se verifica com chave e chamada real.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
vi.mock('../lib/gemini', () => ({ ai: { models: { generateContent: vi.fn() } } }))
import { ai } from '../lib/gemini'
import { env } from '../lib/env'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'

const generateContent = vi.mocked(ai.models.generateContent)
type GenResponse = Awaited<ReturnType<typeof ai.models.generateContent>>
const originalKey = env.GEMINI_API_KEY
let counter = 0

/** Simula a IA respeitando a dificuldade alvo e a quantidade pedidas no prompt. */
function fakeProvider() {
  generateContent.mockImplementation(async (request) => {
    const prompt = String((request as { contents: unknown }).contents)
    const target = Number(/Dificuldade alvo: (\d)\/5/.exec(prompt)?.[1])
    const count = Number(/Questoes a gerar: (\d+)/.exec(prompt)?.[1])
    const questions = Array.from({ length: count }, () => {
      counter += 1
      return {
        body: `Situacao inedita numero ${counter}: qual alternativa resolve corretamente o problema proposto?`,
        options: ['A', 'B', 'C', 'D', 'E'].map((id, index) => ({
          id, text: `Alternativa ${counter}-${index}`, isCorrect: index === 0 })),
        explanation: 'A primeira alternativa aplica corretamente o conceito avaliado no enunciado.',
        difficulty: target,
      }
    })
    return { text: JSON.stringify({ questions }) } as GenResponse
  })
}

const lastPromptTarget = () => {
  const prompt = String(generateContent.mock.calls.at(-1)![0].contents)
  return Number(/Dificuldade alvo: (\d)\/5/.exec(prompt)![1])
}

let token: string
let email: string
let password: string
let topicId: string
const auth = () => ({ Authorization: `Bearer ${token}` })
const trail = async () => (await api.get('/api/v1/trail/enem').set(auth())).body
const topicProgress = async () => {
  const body = await trail()
  return body.subjects.flatMap((s: { topics: unknown[] }) => s.topics)
    .find((t: { id: string }) => t.id === topicId).progress
}

/** Gera uma sessão via API e responde `correct`/`wrong` usando o gabarito do banco. */
async function practise(correct: number, wrong: number, count = correct + wrong) {
  const created = await api.post('/api/v1/quiz/generate').set(auth()).send({ topicId, count })
  expect(created.status).toBe(201)
  const session = await api.get(`/api/v1/quiz/${created.body.sessionId}`).set(auth())
  expect(session.status).toBe(200)
  const stored = await testPrisma.question.findMany({ where: { generatedForSessionId: created.body.sessionId } })
  const plan = [...Array(correct).fill(true), ...Array(wrong).fill(false)]
  for (const [index, shouldHit] of plan.entries()) {
    const question = stored[index]!
    const options = question.options as Array<{ id: string; isCorrect: boolean }>
    const optionId = options.find((option) => option.isCorrect === shouldHit)!.id
    const answer = await api.post(`/api/v1/quiz/${created.body.sessionId}/answer`).set(auth())
      .send({ questionId: question.id, optionId, timeSpentMs: 30000 })
    expect(answer.status).toBe(200)
  }
  const finished = await api.post(`/api/v1/quiz/${created.body.sessionId}/finish`).set(auth())
  expect(finished.status).toBe(200)
  return { sessionId: created.body.sessionId as string, generation: session.body.generation, stored, finished: finished.body }
}

beforeAll(async () => {
  await truncateUserData()
  env.GEMINI_API_KEY = 'mock-only-not-a-real-key'
  fakeProvider()
  const account = await registerAndLogin('adaptive_journey')
  // Jornada longa (muitas práticas no mesmo dia): conta Plus para não esbarrar na cota diária do gratuito.
  await testPrisma.user.update({ where: { id: account.userId }, data: { plan: 'PLUS', planExpiresAt: null } })
  token = account.token
  email = account.email
  password = account.password
  const exam = await testPrisma.vestibular.findUniqueOrThrow({ where: { slug: 'enem' } })
  expect((await api.post('/api/v1/enrollments').set(auth()).send({ vestibularId: exam.id })).status).toBe(201)
})
afterAll(async () => {
  env.GEMINI_API_KEY = originalKey
  generateContent.mockReset()
  await testPrisma.$disconnect()
})

describe('jornada adaptativa (provedor de IA simulado)', () => {
  it('1. diagnóstico inicial forte define a dificuldade da primeira prática (instantânea, do acervo)', async () => {
    const path = '/api/v1/diagnostic/enem'
    let state = (await api.post(`${path}/profile`).set(auth()).send({
      schoolStage: 'medio', examHorizon: 'este-ano', weeklyMinutes: 180, difficultSubjects: [] })).body
    const exam = await testPrisma.vestibular.findUniqueOrThrow({ where: { slug: 'enem' } })
    for (let index = 0; index < 12; index++) {
      const record = await testPrisma.enrollment.findFirstOrThrow({ where: { vestibularId: exam.id, user: { email } } })
      const pool = (record.diagnostic as { pool: Array<{ id: string; options: Array<{ id: string; isCorrect: boolean }> }> }).pool
      const right = pool.find((q) => q.id === state.question.id)!.options.find((o) => o.isCorrect)!
      state = (await api.post(`${path}/answer`).set(auth()).send({ questionId: state.question.id, optionId: right.id })).body
    }
    expect(state.status).toBe('completed')

    const before = await trail()
    topicId = before.recommendation.topicId
    const diagnosticTarget = before.recommendation.targetDifficulty as number
    expect(diagnosticTarget).toBeGreaterThanOrEqual(2)
    expect(before.recommendation.reason).toContain('diagnóstico')

    const calls = generateContent.mock.calls.length
    const first = await practise(3, 0)
    // A primeira prática sai do acervo na hora, já na dificuldade definida pelo diagnóstico.
    expect(generateContent.mock.calls.length).toBe(calls)
    expect(first.generation).toMatchObject({ source: 'CURATED', fallbackReason: 'INSTANT_FIRST_PRACTICE', targetDifficulty: diagnosticTarget, targetSatisfied: true })
    expect(first.stored.every((q) => q.source === 'CURATED' && Math.abs(q.difficulty - diagnosticTarget) <= 1)).toBe(true)

    // 2. Poucas respostas: nada de domínio declarado, mas a evidência fica guardada.
    expect(first.finished.performance).toMatchObject({ previousLevel: 0, newLevel: 0, decision: 'collect', pendingAnswers: 3 })
    expect((await topicProgress()).masteryLevel).toBe(0)
  })

  it('3. evidência suficiente com acertos avança o domínio e a próxima geração pede o novo nível', async () => {
    const second = await practise(3, 0)
    expect(second.finished.performance).toMatchObject({ previousLevel: 0, newLevel: 1, decision: 'advance', evidenceCount: 6 })
    const progress = await topicProgress()
    expect(progress.masteryLevel).toBe(1)
    const recommendation = (await trail()).recommendation
    expect(recommendation.targetDifficulty).toBe(2)

    const third = await api.post('/api/v1/quiz/generate').set(auth()).send({ topicId, count: 3 })
    expect(third.status).toBe(201)
    expect(lastPromptTarget()).toBe(2)
    const meta = (await testPrisma.quizSession.findUniqueOrThrow({ where: { id: third.body.sessionId } })).generationMetadata
    expect(meta).toMatchObject({ targetDifficulty: 2, source: 'AI_GENERATED' })
    await testPrisma.quizSession.update({ where: { id: third.body.sessionId }, data: { finishedAt: new Date() } })
  })

  it('4. o progresso persiste após novo login', async () => {
    const login = await api.post('/api/v1/auth/login').send({ email, password })
    expect(login.status).toBe(200)
    token = login.body.accessToken
    expect((await topicProgress()).masteryLevel).toBe(1)
    const sessions = await testPrisma.quizSession.findMany({ where: { topicId, user: { email }, answers: { some: {} } } })
    expect(sessions.length).toBe(2)
  })

  it('5. erros recorrentes geram reforço sem subir a dificuldade, e o novo alvo chega ao prompt', async () => {
    const weak = await practise(0, 5)
    expect(weak.finished.performance.decision).toBe('reinforce')
    const recommendation = (await trail()).recommendation
    expect(recommendation).toMatchObject({ topicId, kind: 'reinforcement' })
    // Regressão encontrada por este teste: acertos antigos em dificuldade maior
    // (diagnóstico) faziam o reforço pedir questões MAIS difíceis do que as erradas.
    expect(recommendation.targetDifficulty).toBeLessThanOrEqual(2)

    const next = await api.post('/api/v1/quiz/generate').set(auth()).send({ topicId, count: 3 })
    expect(lastPromptTarget()).toBe(recommendation.targetDifficulty)
    expect(String(generateContent.mock.calls.at(-1)![0].contents)).toContain('Topicos com dificuldade recente')
    await testPrisma.quizSession.update({ where: { id: next.body.sessionId }, data: { finishedAt: new Date() } })
  })

  it('6. falha da IA cai na reserva curada e a origem fica identificada como CURATED', async () => {
    generateContent.mockRejectedValueOnce(new Error('provider unavailable'))
    const created = await api.post('/api/v1/quiz/generate').set(auth()).send({ topicId, count: 3 })
    expect(created.status).toBe(201)
    const session = await api.get(`/api/v1/quiz/${created.body.sessionId}`).set(auth())
    expect(session.body.generation).toMatchObject({ source: 'CURATED', fallbackReason: 'AI_UNAVAILABLE_OR_INVALID' })
    const stored = await testPrisma.question.findMany({ where: { generatedForSessionId: created.body.sessionId } })
    expect(stored.length).toBeGreaterThan(0)
    expect(stored.every((q) => q.source === 'CURATED')).toBe(true)
    fakeProvider()
  })
})
