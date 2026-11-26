import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('../lib/gemini', () => ({ ai: { models: { generateContent: vi.fn() } } }))
import { ai } from '../lib/gemini'
import { env } from '../lib/env'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'
import { itemScale, normalizeResult, normalizeVerdict, secondPhaseQuestions } from '../modules/secondPhase/secondPhase'

const generate = vi.mocked(ai.models.generateContent)
type GenResponse = Awaited<ReturnType<typeof ai.models.generateContent>>
const originalKey = env.GEMINI_API_KEY
beforeAll(() => { env.GEMINI_API_KEY = 'mock-key' })
afterAll(async () => { env.GEMINI_API_KEY = originalKey; await testPrisma.$disconnect() })
beforeEach(async () => { await truncateUserData(); generate.mockReset() })

describe('2ª fase dissertativa', () => {
  it('escala fixa: pontos da banca, ou 2 por item da resposta esperada; a nota da IA é reescalada', () => {
    expect(itemScale({ criteria: '- item a: 1 ponto.\n - item b: 2 pontos.\n - item c: 2 pontos.', expected: '' })).toEqual([{ item: 'a', max: 1 }, { item: 'b', max: 2 }, { item: 'c', max: 2 }])
    expect(itemScale({ criteria: '', expected: 'a. Primeiro.\nb) Segundo.\nd. solto' })).toEqual([{ item: 'a', max: 2 }, { item: 'b', max: 2 }])
    const scale = [{ item: 'a', max: 1 }, { item: 'b', max: 2 }, { item: 'c', max: 2 }]
    const r = normalizeResult({ items: [
      { item: 'a', score: 1, max: 2, verdict: 'parcial', feedback: 'Metade certa.' },
      { item: 'b)', score: 2, max: 2, verdict: 'correta', feedback: 'Tudo certo.' },
      { item: 'd', score: 2, max: 2, verdict: 'correta', feedback: 'Item que não existe.' },
    ], summary: 'Boa resposta.' }, scale)
    expect(r.items.map((i) => [i.item, i.score, i.max, i.verdict])).toEqual([['a', 0.5, 1, 'parcial'], ['b', 2, 2, 'correta'], ['c', 0, 2, 'em branco']])
    expect([r.score, r.maxScore]).toEqual([2.5, 5])
    for (const q of secondPhaseQuestions()) expect(itemScale(q).length, q.id).toBeGreaterThanOrEqual(2)
  })

  it('aceita as variações de veredito que a IA escreve', () => {
    expect(normalizeVerdict('correto')).toBe('correta')
    expect(normalizeVerdict('Incorreto')).toBe('incorreta')
    expect(normalizeVerdict('parcialmente correta')).toBe('parcial')
    expect(normalizeVerdict('Em branco')).toBe('em branco')
    expect(normalizeVerdict('???', 0, 2)).toBe('incorreta')
    const r = normalizeResult({ items: [{ item: 'a', score: 1, max: 1, verdict: 'correto', feedback: 'Unidade certa.' }], summary: 'Ok, boa.' })
    expect(r.items[0]!.verdict).toBe('correta')
  })

  it('banco da Fuvest 2025 carregado com enunciado em imagem, resposta esperada e critérios', () => {
    const qs = secondPhaseQuestions()
    expect(qs.length).toBeGreaterThanOrEqual(40)
    const mpox = qs.find((q) => q.id === 'fuvest2025-biol-01')!
    expect(mpox.imageUrl).toBe('/question-media/2fase/fuvest2025-biol-01.webp')
    expect(mpox.expected).toContain('Proteína')
    expect(mpox.criteria).toContain('item b: 2 pontos')
  })

  it('nota não passa do máximo do item e soma o total', () => {
    const r = normalizeResult({ items: [{ item: 'a', score: 3, max: 1, verdict: 'correta', feedback: 'Certo, citou o uso de máscara.' }, { item: 'b', score: 1, max: 2, verdict: 'parcial', feedback: 'Faltou justificar.' }], summary: 'Boa resposta.' })
    expect([r.score, r.maxScore]).toEqual([2, 3])
  })

  it('lista sem gabarito; gratuito vê a resposta esperada mas não tem correção', async () => {
    const s = await registerAndLogin('sp_free')
    const auth = `Bearer ${s.token}`
    const list = await api.get('/api/v1/second-phase').set('Authorization', auth)
    expect(list.status).toBe(200)
    expect(JSON.stringify(list.body)).not.toContain('Proteína/peptídeo')
    expect((await api.get('/api/v1/second-phase/fuvest2025-biol-01/expected').set('Authorization', auth)).body.expected).toContain('Proteína')
    const res = await api.post('/api/v1/second-phase/fuvest2025-biol-01/answer').set('Authorization', auth).send({ answer: 'a. Usar máscara. b. Proteínas. c. Mutações.' })
    expect(res.status).toBe(402)
  })

  it('Plus recebe a correção item a item e o histórico', async () => {
    const s = await registerAndLogin('sp_plus')
    await testPrisma.user.update({ where: { id: s.userId }, data: { plan: 'PLUS', planExpiresAt: null } })
    const auth = `Bearer ${s.token}`
    generate.mockResolvedValueOnce({ text: JSON.stringify({ items: [
      { item: 'a', score: 1, max: 1, verdict: 'correta', feedback: 'Prevenção correta: evitar contato.' },
      { item: 'b', score: 2, max: 2, verdict: 'correta', feedback: 'Proteínas, com justificativa.' },
      { item: 'c', score: 1, max: 2, verdict: 'parcial', feedback: 'Citou mutação, faltou a seleção.' }], summary: 'Quase completa.' }) } as GenResponse)
    const res = await api.post('/api/v1/second-phase/fuvest2025-biol-01/answer').set('Authorization', auth)
      .send({ answer: 'a. Evitar contato com feridas. b. Proteínas, que geram anticorpos. c. Mutações.' })
    expect(res.status).toBe(200)
    expect(res.body.attempt).toMatchObject({ score: 4, maxScore: 5 })
    expect(res.body.expected).toContain('Proteína')
    const one = await api.get('/api/v1/second-phase/fuvest2025-biol-01').set('Authorization', auth)
    expect(one.body.attempts).toHaveLength(1)
    const list = await api.get('/api/v1/second-phase').set('Authorization', auth)
    expect(list.body.questions.find((q: { id: string }) => q.id === 'fuvest2025-biol-01')).toMatchObject({ attempts: 1, bestScore: 4 })
  })
})
