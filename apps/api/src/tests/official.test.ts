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

  it('questão com enunciado inconsistente fica fora da prática', async () => {
    const topic = await seedOfficial('Interpretação de Texto', 3, 'cofenem2021q')
    await testPrisma.question.create({ data: {
      id: 'cofenem2021q165', topicId: topic.id, source: 'OFFICIAL', year: 2021, origin: 'ENEM 2021 · questão 165',
      body: 'Questão inconsistente.', explanation: '', difficulty: 3,
      options: ['A', 'B', 'C', 'D', 'E'].map((id) => ({ id, text: `Alt ${id}`, isCorrect: id === 'D' })),
    } })
    const s = await student('off_inconsistent', topic.id)
    const session = await practise(s.token, topic.id, 4)
    const copies = await testPrisma.question.findMany({ where: { generatedForSessionId: session.sessionId } })
    expect(copies.filter((q) => q.officialRefId).length).toBe(3)
    expect(copies.some((q) => q.officialRefId === 'cofenem2021q165')).toBe(false)
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
    const current = await testPrisma.topic.findUniqueOrThrow({ where: { id: one.topicId } })
    const other = await testPrisma.topic.findFirstOrThrow({ where: { NOT: { id: one.topicId }, subjectId: current.subjectId } }) // mesma área
    await testPrisma.question.update({ where: { id: one.id }, data: { explanation: 'Explicação revisada.', explanationByAi: false, topicId: other.id, topicSource: 'ai' } })
    expect(run()).toMatch(/0 novas, 0 atualizadas, \d+ no arquivo, 0 explicações refeitas/)
    // Questão de Natureza que ficou num tópico de Humanas (erro da base de origem) volta para a fila da IA.
    const humanas = await testPrisma.topic.findFirstOrThrow({ where: { name: 'População, Migrações e Urbanização', subject: { vestibular: { slug: 'enem' } } } })
    await testPrisma.question.update({ where: { id: 'cofenem2022q092' }, data: { topicId: humanas.id, topicSource: 'ai' } })
    run()
    const fixed = await testPrisma.question.findUniqueOrThrow({ where: { id: 'cofenem2022q092' }, include: { topic: { include: { subject: true } } } })
    expect(fixed.topicSource).toBeNull()
    expect(['fisica', 'quimica', 'biologia', 'ciencias-natureza']).toContain(fixed.topic.subject.slug)
    const after = await testPrisma.question.findUniqueOrThrow({ where: { id: one.id } })
    expect(after.explanation).toBe('Explicação revisada.')
    expect(after.topicId).toBe(other.id) // tópico escolhido pela IA não é desfeito
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

describe('questões oficiais com figura', () => {
  it('a cópia da sessão leva a figura e a IA recebe a imagem para explicar; sem imagem, não explica às cegas', async () => {
    const topic = await seedOfficial('Probabilidade e Estatística', 3, 'cofenem2019q')
    await testPrisma.question.updateMany({ where: { source: 'OFFICIAL' }, data: { imageUrl: '/question-media/enem/teste.webp', media: { imageAlt: 'Figura da questão' } } })
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
    let imageOk = true
    const realFetch = globalThis.fetch
    globalThis.fetch = (async () => (imageOk ? new Response(png, { headers: { 'content-type': 'image/webp' } }) : new Response('nope', { status: 404 }))) as typeof fetch
    generateContent.mockResolvedValue({ text: EXPLANATION } as GenResponse)
    try {
      const s = await student('off_image', topic.id)
      const session = await practise(s.token, topic.id)
      expect(session.questions[0].imageUrl).toBe('/question-media/enem/teste.webp')
      expect(session.questions[0].imageAlt).toBe('Figura da questão')
      await new Promise((r) => setTimeout(r, 300))
      const call = generateContent.mock.calls[0][0] as { contents: Array<{ parts: Array<{ inlineData?: { mimeType: string } }> }> }
      expect(call.contents[0].parts[0].inlineData?.mimeType).toBe('image/webp')
      imageOk = false
      generateContent.mockClear()
      await testPrisma.question.updateMany({ data: { explanation: '', explanationByAi: false } })
      const res = await api.post(`/api/v1/quiz/${session.sessionId}/answer`).set('Authorization', `Bearer ${s.token}`).send({ questionId: session.questions[0].id, optionId: 'A', timeSpentMs: 1000 })
      expect(res.body.explanation).toMatch(/^Gabarito oficial: alternativa C\./)
      expect(res.body.explanationByAi).toBe(false)
      expect(generateContent).not.toHaveBeenCalled()
    } finally { globalThis.fetch = realFetch }
  })
})

describe('classificação de tópico e dificuldade pela IA', () => {
  it('escolhe só entre os tópicos da área, estima a dificuldade e grava uma vez; sem estimativa, o nível não aparece', async () => {
    const { classifyNextOfficial } = await import('../modules/quiz/officialTopics')
    const topic = await seedOfficial('Razões, Porcentagens e Matemática Financeira', 3, 'cofenem2018q')
    const s = await student('off_level', topic.id)
    generateContent.mockResolvedValue({ text: EXPLANATION } as GenResponse)
    const before = await practise(s.token, topic.id)
    expect(before.questions.every((q: { difficulty: number | null }) => q.difficulty === null)).toBe(true)
    await new Promise((r) => setTimeout(r, 300)) // explicações em segundo plano terminam antes
    generateContent.mockReset()
    generateContent.mockResolvedValueOnce({ text: '{"topic":"Funções e Gráficos","difficulty":4}' } as GenResponse)
    generateContent.mockResolvedValueOnce({ text: '{"topic":"Revolução Francesa","difficulty":9}' } as GenResponse) // fora da lista e da escala
    generateContent.mockResolvedValueOnce({ text: '{"difficulty":3}' } as GenResponse) // volta na 2ª só pela dificuldade que faltou
    generateContent.mockResolvedValueOnce({ text: '{"topic":"Grandezas, Medidas e Escalas","difficulty":2}' } as GenResponse)
    expect(await classifyNextOfficial()).toBe('classified')
    expect(await classifyNextOfficial()).toBe('kept')
    expect(await classifyNextOfficial()).toBe('classified')
    expect(await classifyNextOfficial()).toBe('classified')
    expect(await classifyNextOfficial()).toBe('done')
    const prompt = String(generateContent.mock.calls[0][0].contents)
    expect(prompt).toContain('- Funções e Gráficos:')
    expect(prompt).not.toContain('Cultura, Identidade e Socialização')
    expect(String(generateContent.mock.calls[2][0].contents)).not.toContain('Topicos (nome')
    const rows = await testPrisma.question.findMany({ where: { source: 'OFFICIAL', generatedForSessionId: null }, orderBy: { id: 'asc' }, include: { topic: true } })
    expect(rows.map((r) => [r.topic.name, r.topicSource, r.difficulty, r.difficultySource])).toEqual([
      ['Funções e Gráficos', 'ai', 4, 'ai'],
      ['Razões, Porcentagens e Matemática Financeira', 'keyword', 3, 'ai'],
      ['Grandezas, Medidas e Escalas', 'ai', 2, 'ai'],
    ])
    // As cópias da sessão já criada passam a mostrar o nível.
    const after = await api.get(`/api/v1/quiz/${before.sessionId}`).set('Authorization', `Bearer ${s.token}`)
    expect(after.body.questions.every((q: { difficulty: number | null }) => typeof q.difficulty === 'number')).toBe(true)
  })
})

describe('diagnóstico com questões oficiais', () => {
  it('usa questões reais na área que tem banco e completa as outras com autorais', async () => {
    const topic = await seedOfficial('Funções e Gráficos', 10, 'cofenem2021q')
    const s = await student('official_diag', topic.id)
    const path = '/api/v1/diagnostic/enem'
    const started = await api.post(`${path}/profile`).set('Authorization', `Bearer ${s.token}`)
      .send({ schoolStage: 'medio', examHorizon: 'este-ano', weeklyMinutes: 180, difficultSubjects: [] })
    expect(started.status).toBe(200)
    const exam = await testPrisma.vestibular.findUniqueOrThrow({ where: { slug: 'enem' } })
    const record = await testPrisma.enrollment.findUniqueOrThrow({ where: { userId_vestibularId: { userId: s.userId, vestibularId: exam.id } } })
    const pool = (record.diagnostic as { pool: { area: string; origin?: string | null; difficulty: number }[] }).pool
    const math = pool.filter((q) => q.area === 'matematica')
    expect(math).toHaveLength(8)
    expect(math.every((q) => q.origin?.startsWith('ENEM 2020') && q.difficulty === 2)).toBe(true)
    expect(pool.filter((q) => q.area === 'humanas').length).toBeGreaterThan(0)
    // Segunda pergunta é de Matemática e mostra a origem, sem gabarito.
    const second = await api.post(`${path}/answer`).set('Authorization', `Bearer ${s.token}`).send({ questionId: started.body.question.id, optionId: null })
    expect(second.body.question.origin).toMatch(/^ENEM 2020/)
    expect(second.body.question.options.every((o: object) => !('isCorrect' in o))).toBe(true)
  })
})
