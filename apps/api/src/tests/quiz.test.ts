import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { truncateUserData, testPrisma } from './helpers/truncate'

/**
 * Fluxo completo de quiz com fallback questions (GEMINI_API_KEY ausente em .env.test).
 *
 * Valores esperados (calculados com base em fallbackQuestions.ts + quiz.service.ts):
 * - Tópico: Interpretação de Texto (1º topic do ENEM, desbloqueado na matrícula)
 * - 3 questões fallback; correct options: B(idx=1), C(idx=2), D(idx=3)
 * - Responder B, C, D → 3 acertos, accuracy = 1.0
 * - XP: Q1=4, Q2=4, Q3=6 (streak perfeito) = 14 + 10 bônus sessão perfeita = 24
 * - Three answers are insufficient evidence to advance mastery.
 */

let token: string
let firstTopicId: string
let sessionId: string
let questionIds: string[]
let correctOptions: string[]
let userId: string

beforeAll(async () => {
  await truncateUserData()

  const auth = await registerAndLogin('quiz_flow')
  token = auth.token
  userId = auth.userId

  // Pegar ENEM id
  const vestRes = await api.get('/api/v1/vestibulares').set('Authorization', `Bearer ${token}`)
  const enem = (vestRes.body as Array<{ slug: string; id: string }>).find((v) => v.slug === 'enem')
  if (!enem) throw new Error('ENEM não encontrado — seed não rodou?')

  // Matricular
  await api
    .post('/api/v1/enrollments')
    .set('Authorization', `Bearer ${token}`)
    .send({ vestibularId: enem.id })

  // Pegar trilha e primeiro topicId desbloqueado
  const trailRes = await api.get('/api/v1/trail/enem').set('Authorization', `Bearer ${token}`)
  const allTopics = (trailRes.body.subjects as Array<{ topics: Array<{ id: string; progress: { unlocked: boolean } }> }>)
    .flatMap((s) => s.topics)
  const first = allTopics.find((t) => t.progress.unlocked)
  if (!first) throw new Error('Nenhum tópico desbloqueado')
  firstTopicId = first.id
})

afterAll(async () => {
  await testPrisma.$disconnect()
})

describe('POST /api/v1/quiz/generate', () => {
  it('cria sessão e retorna jobId + sessionId', async () => {
    const res = await api
      .post('/api/v1/quiz/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ topicId: firstTopicId, count: 3 })

    // Captura antes dos asserts para que os testes seguintes funcionem mesmo se este falhar
    sessionId = res.body.sessionId

    expect(res.status).toBe(201)
    expect(sessionId).toBeTruthy()
    expect(res.body.jobId).toMatch(/^sync-/)
  })
})

describe('GET /api/v1/quiz/:sessionId', () => {
  it('retorna sessão com 3 questões e sem isCorrect exposto', async () => {
    const res = await api
      .get(`/api/v1/quiz/${sessionId}`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.questions).toHaveLength(3)
    questionIds = (res.body.questions as Array<{ id: string }>).map((q) => q.id)

    // isCorrect NÃO deve ser exposto nas options
    const hasIsCorrect = (res.body.questions as Array<{ options: Array<{ isCorrect?: boolean }> }>)
      .some((q) => q.options.some((o) => 'isCorrect' in o))
    expect(hasIsCorrect).toBe(false)

    // Buscar gabarito direto do banco para os asserts de XP
    correctOptions = await Promise.all(
      questionIds.map(async (id) => {
        const q = await testPrisma.question.findUnique({ where: { id } })
        const opts = q!.options as Array<{ id: string; isCorrect: boolean }>
        return opts.find((o) => o.isCorrect)!.id
      }),
    )
  })
})

describe('POST /api/v1/quiz/:sessionId/answer', () => {
  it('aceita resposta correta e retorna xpDelta = 4', async () => {
    const res = await api
      .post(`/api/v1/quiz/${sessionId}/answer`)
      .set('Authorization', `Bearer ${token}`)
      .send({ questionId: questionIds[0], optionId: correctOptions[0], timeSpentMs: 3000 })

    expect(res.status).toBe(200)
    expect(res.body.isCorrect).toBe(true)
    expect(res.body.xpDelta).toBe(4)
  })

  it('rejeita resposta duplicada com 400 ALREADY_ANSWERED', async () => {
    const res = await api
      .post(`/api/v1/quiz/${sessionId}/answer`)
      .set('Authorization', `Bearer ${token}`)
      .send({ questionId: questionIds[0], optionId: correctOptions[0], timeSpentMs: 1000 })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('ALREADY_ANSWERED')
  })

  it('responde Q2 (xpDelta=4) e Q3 com streak bônus (xpDelta=6)', async () => {
    // Q2: apenas 1 resposta anterior → sem streak → 4 XP
    const res2 = await api
      .post(`/api/v1/quiz/${sessionId}/answer`)
      .set('Authorization', `Bearer ${token}`)
      .send({ questionId: questionIds[1], optionId: correctOptions[1], timeSpentMs: 3000 })

    expect(res2.status).toBe(200)
    expect(res2.body.isCorrect).toBe(true)
    expect(res2.body.xpDelta).toBe(4)

    // Q3: últimas 2 corretas (Q1 e Q2) → streak perfeito → 6 XP
    const res3 = await api
      .post(`/api/v1/quiz/${sessionId}/answer`)
      .set('Authorization', `Bearer ${token}`)
      .send({ questionId: questionIds[2], optionId: correctOptions[2], timeSpentMs: 3000 })

    expect(res3.status).toBe(200)
    expect(res3.body.isCorrect).toBe(true)
    expect(res3.body.xpDelta).toBe(6)
  })
})

describe('POST /api/v1/quiz/:sessionId/finish', () => {
  it('finaliza com XP=24 sem declarar dominio com apenas tres respostas', async () => {
    const res = await api
      .post(`/api/v1/quiz/${sessionId}/finish`)
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)

    const body = res.body
    expect(body.correct).toBe(3)
    expect(body.wrong).toBe(0)
    expect(body.skipped).toBe(0)
    expect(body.isPerfect).toBe(true)
    expect(body.xpEarned).toBe(24)  // 4+4+6=14 respostas + 10 bônus perfeito
    expect(body.newMasteryLevel).toBe(0)
    const trail = await api.get('/api/v1/trail/enem').set('Authorization', `Bearer ${token}`)
    expect(trail.body.subjects[0].topics[1].progress.unlocked).toBe(true)
    expect(trail.body.subjects[0].topics[0].progress.completed).toBe(false)
    const slugs = (body.newAchievements as Array<{ slug: string }>).map((a) => a.slug)
    expect(slugs).toContain('first_flight')
    expect(slugs).toContain('perfect_wing')
    const user = await testPrisma.user.findUniqueOrThrow({ where: { id: userId } })
    const achievementXp = body.newAchievements.reduce((sum: number, item: { xpBonus: number }) => sum + item.xpBonus, 0)
    expect(user.xp).toBe(body.xpEarned + achievementXp)
  })
  it('finalizar novamente nao duplica XP ou sessoes', async () => {
    const before = await testPrisma.user.findUniqueOrThrow({ where: { id: userId } })
    const again = await api.post(`/api/v1/quiz/${sessionId}/finish`).set('Authorization', `Bearer ${token}`)
    expect(again.status).toBe(200)
    expect((await testPrisma.user.findUniqueOrThrow({ where: { id: userId } })).xp).toBe(before.xp)
    expect((await testPrisma.userTopicProgress.findUniqueOrThrow({ where: { userId_topicId: { userId, topicId: firstTopicId } } })).sessionsCount).toBe(1)
  })
})

it('nao grava saldo negativo ao errar sem coracoes', async () => {
  await testPrisma.user.update({ where: { id: userId }, data: { hearts: 0 } })
  const generated = await api.post('/api/v1/quiz/generate').set('Authorization', `Bearer ${token}`)
    .send({ topicId: firstTopicId, count: 3 })
  expect(generated.status).toBe(201)
  const question = await testPrisma.question.findFirstOrThrow({
    where: { generatedForSessionId: generated.body.sessionId },
  })
  const wrong = (question.options as Array<{ id: string; isCorrect: boolean }>).find((option) => !option.isCorrect)!
  const answer = await api.post(`/api/v1/quiz/${generated.body.sessionId}/answer`)
    .set('Authorization', `Bearer ${token}`)
    .send({ questionId: question.id, optionId: wrong.id, timeSpentMs: 1000 })
  expect(answer.status).toBe(200)
  expect(answer.body.heartsRemaining).toBe(0)
  expect((await testPrisma.user.findUniqueOrThrow({ where: { id: userId } })).hearts).toBe(0)
})

it('serializa respostas concorrentes e finalizacao sem duplicar dados', async () => {
  const generated = await api.post('/api/v1/quiz/generate').set('Authorization', `Bearer ${token}`)
    .send({ topicId: firstTopicId, count: 3 })
  expect(generated.status).toBe(201)
  const id = generated.body.sessionId as string
  const question = await testPrisma.question.findFirstOrThrow({ where: { generatedForSessionId: id } })
  const correct = (question.options as Array<{ id: string; isCorrect: boolean }>).find((o) => o.isCorrect)!
  const input = { questionId: question.id, optionId: correct.id, timeSpentMs: 3000 }
  const responses = await Promise.all([0, 1].map(() => api.post(`/api/v1/quiz/${id}/answer`).set('Authorization', `Bearer ${token}`).send(input)))
  expect(responses.map((res) => res.status).sort()).toEqual([200, 400])
  expect(await testPrisma.userAnswer.count({ where: { sessionId: id } })).toBe(1)
  const before = await testPrisma.user.findUniqueOrThrow({ where: { id: userId } })
  const finishes = await Promise.all([0, 1].map(() => api.post(`/api/v1/quiz/${id}/finish`).set('Authorization', `Bearer ${token}`)))
  expect(finishes.map((res) => res.status)).toEqual([200, 200])
  expect((await testPrisma.user.findUniqueOrThrow({ where: { id: userId } })).xp).toBe(before.xp)
})
