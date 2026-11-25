import { beforeEach, describe, expect, it } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'
import { memoryOutbox } from '../lib/mailer'
import { brtMonth, previousBrtMonth, runGuardianReports } from '../modules/engagement/guardian'

beforeEach(async () => { await truncateUserData(); memoryOutbox.length = 0 })

const linkToken = (text: string, key: string) => new RegExp(`#${key}=([A-Za-z0-9_.-]+)`).exec(text)?.[1] ?? ''

async function seedAnswers(userId: string, when: Date, results: boolean[]) {
  const topic = await testPrisma.topic.findFirstOrThrow({ where: { name: 'Interpretação de Texto', subject: { vestibular: { slug: 'enem' } } } })
  const session = await testPrisma.quizSession.create({ data: { userId, topicId: topic.id } })
  for (const [i, ok] of results.entries()) {
    const q = await testPrisma.question.create({ data: { topicId: topic.id, generatedForSessionId: session.id, body: `Q${i}`, explanation: 'x', difficulty: 2,
      options: [{ id: 'A', text: 'a', isCorrect: true }, { id: 'B', text: 'b', isCorrect: false }] } })
    await testPrisma.userAnswer.create({ data: { userId, questionId: q.id, sessionId: session.id, optionId: ok ? 'A' : 'B', isCorrect: ok, timeSpentMs: 1000, answeredAt: when } })
  }
}

describe('responsável com resumo mensal', () => {
  it('mês de Brasília', () => {
    expect(previousBrtMonth(new Date('2026-12-01T13:00:00Z')).key).toBe('2026-11')
    // 1º de dezembro 01h UTC ainda é 30 de novembro em Brasília.
    expect(previousBrtMonth(new Date('2026-12-01T01:00:00Z')).key).toBe('2026-10')
    expect(brtMonth(2026, 10).start.toISOString()).toBe('2026-11-01T03:00:00.000Z')
  })

  it('aluno cadastra, responsável confirma, recebe o resumo uma vez e pode sair', async () => {
    const s = await registerAndLogin('guardian_flow')
    const auth = `Bearer ${s.token}`
    expect((await api.put('/api/v1/guardian').set('Authorization', auth).send({ email: s.email })).status).toBe(400)
    const set = await api.put('/api/v1/guardian').set('Authorization', auth).send({ email: 'Mae@Example.com' })
    expect(set.status).toBe(200)
    expect(set.body.guardian).toMatchObject({ email: 'mae@example.com', status: 'pending' })
    expect(memoryOutbox).toHaveLength(1)
    expect(memoryOutbox[0]!.to).toBe('mae@example.com')
    const token = linkToken(memoryOutbox[0]!.text, 'confirmar')
    expect(token.length).toBeGreaterThan(20)
    // Só o hash fica no banco.
    expect(JSON.stringify(await testPrisma.guardian.findFirst())).not.toContain(token)

    // Antes de confirmar, não recebe resumo.
    const month = brtMonth(2026, 10)
    await seedAnswers(s.userId, new Date(month.start.getTime() + 2 * 86_400_000), [true, true, false])
    await seedAnswers(s.userId, new Date(month.start.getTime() + 5 * 86_400_000), [true])
    const now = new Date('2026-12-01T14:00:00Z')
    expect(await runGuardianReports({ dryRun: false, now })).toMatchObject({ eligible: 0 })

    const confirmed = await api.post('/api/v1/guardian/confirm').send({ token })
    expect(confirmed.status).toBe(200)
    expect(confirmed.body.studentFirstName).toBe('Usuário')
    expect((await api.get('/api/v1/guardian').set('Authorization', auth)).body.guardian.status).toBe('confirmed')

    memoryOutbox.length = 0
    expect(await runGuardianReports({ dryRun: true, now })).toMatchObject({ eligible: 1, sent: 0 })
    expect(await runGuardianReports({ dryRun: false, now })).toMatchObject({ sent: 1 })
    const mail = memoryOutbox[0]!
    expect(mail.subject).toContain('novembro de 2026')
    expect(mail.text).toContain('estudou em 2 dias e respondeu 4 questões, com 75% de acerto')
    expect(mail.text).toContain('não preveem a nota')
    expect(await runGuardianReports({ dryRun: false, now })).toMatchObject({ sent: 0, skippedAlreadySent: 1 })

    const out = await api.post('/api/v1/guardian/unsubscribe').send({ token: linkToken(mail.text, 'sair') })
    expect(out.status).toBe(200)
    expect((await api.get('/api/v1/guardian').set('Authorization', auth)).body.guardian.status).toBe('unsubscribed')
    expect((await api.post('/api/v1/guardian/unsubscribe').send({ token: 'abc.def' })).status).toBe(400)
  })

  it('prévia mostra ao aluno os números do mês e remover apaga o responsável', async () => {
    const s = await registerAndLogin('guardian_preview')
    const auth = `Bearer ${s.token}`
    await seedAnswers(s.userId, new Date(), [true, false])
    const got = (await api.get('/api/v1/guardian').set('Authorization', auth)).body
    expect(got.guardian).toBeNull()
    expect(got.preview).toMatchObject({ questions: 2, correct: 1, accuracy: 50, partial: true })
    await api.put('/api/v1/guardian').set('Authorization', auth).send({ email: 'pai@example.com' })
    expect((await api.put('/api/v1/guardian').set('Authorization', auth).send({ email: 'outro@example.com' })).status).toBe(429)
    expect((await api.delete('/api/v1/guardian').set('Authorization', auth)).status).toBe(204)
    expect(await testPrisma.guardian.count()).toBe(0)
    expect((await api.post('/api/v1/guardian/confirm').send({ token: 'x'.repeat(43) })).status).toBe(400)
  })
})
