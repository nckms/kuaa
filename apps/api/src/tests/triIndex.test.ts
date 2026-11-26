import { describe, expect, it } from 'vitest'
import { scoreAreas, triData } from '../modules/exams/tri'
import { computeTriIndex, MIN_AREA_ITEMS, type TriResponse } from '../modules/index/triIndex'

const ids = (year: number, from: number) => Array.from({ length: 45 }, (_, k) => `cofenem${year}q${String(from + k).padStart(3, '0')}`)
const at = (day: number) => new Date(Date.UTC(2026, 10, day))

describe('Índice Kuaa na escala TRI', () => {
  const { params } = triData()
  const mt = ids(2023, 136).filter((id) => params[id])
  const cn = ids(2023, 91).filter((id) => params[id])
  const lc = ids(2023, 1).filter((id) => params[id])
  const ch = ids(2023, 46).filter((id) => params[id])

  it('prova completa de Matemática: mesma nota do cálculo da prova anterior', () => {
    const answers: Record<string, string> = {}
    const correct = (id: string) => Number(id.slice(-3)) % 3 !== 0
    const exam = scoreAreas(mt, answers, (id) => correct(id))[0]!.score
    const index = computeTriIndex(mt.map((id) => ({ id, correct: correct(id), at: at(1) })))
    expect(index.areas.find((a) => a.area === 'MT')!.score).toBeCloseTo(exam, 1)
  })

  it(`área com menos de ${MIN_AREA_ITEMS} questões fica sem nota e diz quantas faltam; média só com as 4 áreas`, () => {
    const few = computeTriIndex(mt.slice(0, 4).map((id) => ({ id, correct: true, at: at(1) })))
    expect(few.areas.find((a) => a.area === 'MT')).toMatchObject({ score: null, items: 4, needed: MIN_AREA_ITEMS - 4 })
    expect(few.overall).toBeNull()
    const full = computeTriIndex([...mt, ...cn, ...lc, ...ch].map((id, i) => ({ id, correct: i % 2 === 0, at: at(1) })))
    expect(full.overall).not.toBeNull()
    const mean = full.areas.reduce((s, a) => s + a.score!, 0) / 4
    expect(full.overall).toBeCloseTo(mean, 0)
  })

  it('mais questões, margem menor; mais acertos, nota maior', () => {
    const r = (n: number, ok: boolean): TriResponse[] => mt.slice(0, n).map((id) => ({ id, correct: ok, at: at(1) }))
    const small = computeTriIndex(r(12, true)).areas.find((a) => a.area === 'MT')!
    const big = computeTriIndex(r(40, true)).areas.find((a) => a.area === 'MT')!
    expect(big.margin!).toBeLessThan(small.margin!)
    const low = computeTriIndex(r(20, false)).areas.find((a) => a.area === 'MT')!
    expect(computeTriIndex(r(20, true)).areas.find((a) => a.area === 'MT')!.score!).toBeGreaterThan(low.score!)
  })

  it('ignora respostas depois da data pedida (base do "em 7 dias" e da evolução)', () => {
    const responses = mt.map((id, i) => ({ id, correct: true, at: i < 15 ? at(1) : at(20) }))
    expect(computeTriIndex(responses, at(10)).areas.find((a) => a.area === 'MT')!.items).toBe(15)
    expect(computeTriIndex(responses, at(25)).areas.find((a) => a.area === 'MT')!.items).toBe(mt.length)
  })
})

describe('Índice TRI com o banco (fontes e primeira resposta)', () => {
  it('junta trilha (cópia com officialRefId) e prova anterior; conta só a primeira resposta de cada questão', async () => {
    const { api, registerAndLogin } = await import('./helpers/api')
    const { testPrisma, truncateUserData } = await import('./helpers/truncate')
    const { collectTriResponses } = await import('../modules/index/triIndex')
    await truncateUserData()
    const s = await registerAndLogin('tri_index')
    const enem = await testPrisma.vestibular.findFirstOrThrow({ where: { slug: 'enem' } })
    await testPrisma.enrollment.create({ data: { userId: s.userId, vestibularId: enem.id } }).catch(() => undefined)
    const topic = await testPrisma.topic.findFirstOrThrow({ where: { subject: { vestibularId: enem.id } } })
    const mtIds = Array.from({ length: 12 }, (_, i) => `cofenem2023q${136 + i}`)
    for (const id of mtIds) {
      await testPrisma.question.upsert({ where: { id }, update: {}, create: { id, topicId: topic.id, source: 'OFFICIAL', year: 2023, body: id, explanation: '', difficulty: 3,
        options: ['A', 'B', 'C', 'D', 'E'].map((o) => ({ id: o, text: o, isCorrect: o === 'B' })) } })
    }
    // Trilha: cópia da questão oficial; errou em 01/11 e acertou na revisão em 05/11 (vale a primeira).
    const copy = await testPrisma.question.create({ data: { topicId: topic.id, source: 'OFFICIAL', officialRefId: mtIds[0], body: 'cópia', explanation: '', difficulty: 3, options: [] } })
    const session = await testPrisma.quizSession.create({ data: { userId: s.userId, topicId: topic.id } })
    await testPrisma.userAnswer.create({ data: { userId: s.userId, questionId: copy.id, sessionId: session.id, optionId: 'A', isCorrect: false, timeSpentMs: 30_000, answeredAt: new Date('2026-11-01T12:00:00Z') } })
    await testPrisma.userAnswer.create({ data: { userId: s.userId, questionId: copy.id, sessionId: session.id, optionId: 'B', isCorrect: true, timeSpentMs: 30_000, answeredAt: new Date('2026-11-05T12:00:00Z') } })
    // Prova anterior: 11 questões respondidas (uma em branco não entra) + a mesma da trilha, que já foi contada.
    const answers = Object.fromEntries(mtIds.slice(0, 11).map((id, i) => [id, i % 2 ? 'B' : 'C']))
    await testPrisma.examAttempt.create({ data: { userId: s.userId, exam: 'enem', year: 2023, day: 2, questionIds: mtIds, answers, durationSeconds: 18000,
      startedAt: new Date('2026-11-10T12:00:00Z'), finishedAt: new Date('2026-11-10T16:00:00Z') } })
    const responses = await collectTriResponses(s.userId, enem.id)
    expect(responses).toHaveLength(11)
    const first = responses.find((r) => r.id === mtIds[0])!
    expect(first).toMatchObject({ correct: false })
    expect(first.at.toISOString()).toBe('2026-11-01T12:00:00.000Z')
    const res = await api.get('/api/v1/index/enem').set('Authorization', `Bearer ${s.token}`)
    expect(res.status).toBe(200)
    expect(res.body.tri.areas.find((a: { area: string }) => a.area === 'MT')).toMatchObject({ items: 11, correct: 5, needed: 0 })
    expect(res.body.tri.overall).toBeNull()
  })
})

describe('Índice TRI: diagnóstico', () => {
  it('conta as questões do diagnóstico, pelo id oficial (novos) ou pelo enunciado (antigos)', async () => {
    const { registerAndLogin } = await import('./helpers/api')
    const { testPrisma, truncateUserData } = await import('./helpers/truncate')
    const { collectTriResponses } = await import('../modules/index/triIndex')
    await truncateUserData()
    const s = await registerAndLogin('tri_diag')
    const enem = await testPrisma.vestibular.findFirstOrThrow({ where: { slug: 'enem' } })
    const topic = await testPrisma.topic.findFirstOrThrow({ where: { subject: { vestibularId: enem.id } } })
    const opts = ['A', 'B', 'C', 'D', 'E'].map((o) => ({ id: o, text: o, isCorrect: o === 'B' }))
    for (const id of ['cofenem2023q140', 'cofenem2023q141']) {
      await testPrisma.question.upsert({ where: { id }, update: { body: `Enunciado ${id}` }, create: { id, topicId: topic.id, source: 'OFFICIAL', year: 2023, body: `Enunciado ${id}`, explanation: '', difficulty: 3, options: opts } })
    }
    const item = (id: string, extra: object) => ({ id, topicId: topic.id, subjectId: topic.subjectId, subjectName: 'X', area: 'matematica', body: '', explanation: '', difficulty: 3, options: opts, ...extra })
    const diagnostic = { version: 1, profile: {}, areas: [], currentId: null, finishedAt: '2026-11-20T10:00:00.000Z',
      pool: [item('u1', { officialRefId: 'cofenem2023q140' }), item('u2', { body: 'Enunciado cofenem2023q141' }), item('u3', { body: 'questão autoral' })],
      answers: [{ questionId: 'u1', optionId: 'B' }, { questionId: 'u2', optionId: 'A' }, { questionId: 'u3', optionId: 'B' }] }
    await testPrisma.enrollment.upsert({ where: { userId_vestibularId: { userId: s.userId, vestibularId: enem.id } }, update: { diagnostic }, create: { userId: s.userId, vestibularId: enem.id, diagnostic } })
    const responses = (await collectTriResponses(s.userId, enem.id)).sort((a, b) => a.id.localeCompare(b.id))
    expect(responses.map((r) => [r.id, r.correct])).toEqual([['cofenem2023q140', true], ['cofenem2023q141', false]])
  })
})
