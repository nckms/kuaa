import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('../lib/gemini', () => ({ ai: { models: { generateContent: vi.fn() } } }))
import { ai } from '../lib/gemini'
import { env } from '../lib/env'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'
import { normalizeCorrection } from '../modules/essays/essayCorrection'

const generateContent = vi.mocked(ai.models.generateContent)
type GenResponse = Awaited<ReturnType<typeof ai.models.generateContent>>
const originalKey = env.GEMINI_API_KEY
beforeAll(() => { env.GEMINI_API_KEY = 'mock-key' })
afterAll(async () => { env.GEMINI_API_KEY = originalKey; await testPrisma.$disconnect() })
beforeEach(async () => { await truncateUserData(); generateContent.mockReset() })

const BODY = Array.from({ length: 30 }, (_, i) => `A leitura amplia oportunidades e exige políticas de acesso ${i + 1}.`).join(' ') +
  ' Portanto, cabe ao Ministério da Educação criar bibliotecas comunitárias por meio de parcerias com prefeituras.'

function aiResult(overrides: Record<string, unknown> = {}) {
  return {
    annulled: null,
    competencies: [1, 2, 3, 4, 5].map((id) => ({
      id, score: id === 5 ? 120 : 160, justification: `Justificativa da competência ${id} com detalhes suficientes.`,
      excerpts: id === 1 ? [
        { quote: 'exige políticas de acesso 3', issue: 'Problema de exemplo', suggestion: 'Sugestão de exemplo' },
        { quote: 'trecho que o aluno nunca escreveu', issue: 'Inventado', suggestion: 'Não deve aparecer' },
      ] : [],
    })),
    interventionElements: { agent: true, action: true, means: true, effect: false, detail: false },
    summary: 'Texto organizado, com repetição de estrutura e proposta incompleta.',
    priorities: ['Detalhe a proposta de intervenção com efeito e detalhamento.'],
    ...overrides,
  }
}

async function submittedEssay(suffix: string, plus: boolean) {
  const s = await registerAndLogin(suffix)
  const auth = `Bearer ${s.token}`
  if (plus) await testPrisma.user.update({ where: { id: s.userId }, data: { plan: 'PLUS', planExpiresAt: null } })
  const exam = await testPrisma.vestibular.findUniqueOrThrow({ where: { slug: 'enem' } })
  await api.post('/api/v1/enrollments').set('Authorization', auth).send({ vestibularId: exam.id })
  const themeId = (await api.get('/api/v1/essays/themes/enem').set('Authorization', auth)).body.themes[0].id
  const id = (await api.post('/api/v1/essays').set('Authorization', auth).send({ vestibularSlug: 'enem', themeId })).body.id
  await api.patch(`/api/v1/essays/${id}`).set('Authorization', auth).send({ body: BODY })
  await api.post(`/api/v1/essays/${id}/submit`).set('Authorization', auth)
  return { ...s, auth, id }
}

describe('correção completa de redação (Plus)', () => {
  it('normaliza: trecho inventado sai, total soma as competências, anulada zera', () => {
    const ok = normalizeCorrection(aiResult(), BODY)
    expect(ok.total).toBe(760)
    expect(ok.competencies[0]!.excerpts).toHaveLength(1)
    const annulled = normalizeCorrection(aiResult({ annulled: { reason: 'Fuga total ao tema.' } }), BODY)
    expect(annulled.total).toBe(0)
    expect(() => normalizeCorrection(aiResult({ competencies: aiResult().competencies.map((c) => ({ ...c, score: 150 })) }), BODY)).toThrow()
  })

  it('gratuito recebe 402 com o caminho para o Plus', async () => {
    const s = await submittedEssay('corr_free', false)
    const res = await api.post(`/api/v1/essays/${s.id}/correction`).set('Authorization', s.auth)
    expect(res.status).toBe(402)
    expect(res.body.code).toBe('PLUS_REQUIRED')
    expect(generateContent).not.toHaveBeenCalled()
  })

  it('Plus corrige uma vez, guarda, reescreve um trecho e mostra a evolução', async () => {
    const s = await submittedEssay('corr_plus', true)
    generateContent.mockResolvedValueOnce({ text: JSON.stringify(aiResult()) } as GenResponse)
    const res = await api.post(`/api/v1/essays/${s.id}/correction`).set('Authorization', s.auth)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ status: 'done', total: 760 })
    // Pedir de novo devolve a mesma, sem chamar a IA.
    expect((await api.post(`/api/v1/essays/${s.id}/correction`).set('Authorization', s.auth)).body.total).toBe(760)
    expect(generateContent).toHaveBeenCalledTimes(1)
    expect((await api.get(`/api/v1/essays/${s.id}/correction`).set('Authorization', s.auth)).body.total).toBe(760)

    expect((await api.post(`/api/v1/essays/${s.id}/correction/rewrite`).set('Authorization', s.auth)
      .send({ competency: 5, original: 'frase que não existe na redação', rewritten: 'Nova frase.' })).status).toBe(400)
    generateContent.mockResolvedValueOnce({ text: JSON.stringify({ verdict: 'melhorou', comment: 'Agora a proposta tem efeito e detalhamento.' }) } as GenResponse)
    const rw = await api.post(`/api/v1/essays/${s.id}/correction/rewrite`).set('Authorization', s.auth)
      .send({ competency: 5, original: 'cabe ao Ministério da Educação criar bibliotecas comunitárias', rewritten: 'cabe ao Ministério da Educação criar bibliotecas comunitárias, a fim de ampliar o acesso à leitura nas periferias' })
    expect(rw.status).toBe(200)
    expect(rw.body.rewrite.verdict).toBe('melhorou')
    expect(rw.body.correction.rewrites).toHaveLength(1)

    const hist = await api.get('/api/v1/essays/corrections/history').set('Authorization', s.auth)
    expect(hist.status).toBe(200)
    expect(hist.body).toEqual([expect.objectContaining({ essayId: s.id, total: 760 })])
  })

  it('falha da IA não deixa correção pendente nem consome a cota', async () => {
    const s = await submittedEssay('corr_fail', true)
    generateContent.mockResolvedValueOnce({ text: '{"quebrado": true}' } as GenResponse)
    expect((await api.post(`/api/v1/essays/${s.id}/correction`).set('Authorization', s.auth)).status).toBe(503)
    expect(await testPrisma.essayCorrection.count()).toBe(0)
  })
})
