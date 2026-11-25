import { afterAll, beforeEach, describe, expect, it } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'
import { buildPlan, phaseOf } from '../modules/plan/studyPlan'

afterAll(() => testPrisma.$disconnect())
beforeEach(truncateUserData)

async function student(suffix: string, plus: boolean) {
  const s = await registerAndLogin(suffix)
  const auth = `Bearer ${s.token}`
  if (plus) await testPrisma.user.update({ where: { id: s.userId }, data: { plan: 'PLUS', planExpiresAt: null } })
  const exam = await testPrisma.vestibular.findUniqueOrThrow({ where: { slug: 'enem' } })
  await api.post('/api/v1/enrollments').set('Authorization', auth).send({ vestibularId: exam.id })
  return { ...s, auth }
}

describe('plano até a prova (Plus)', () => {
  it('fases pela distância da prova', () => {
    expect([phaseOf(200), phaseOf(90), phaseOf(20), phaseOf(3)]).toEqual(['base', 'treino', 'reta-final', 'vespera'])
  })

  it('gratuito vê a contagem regressiva e o convite', async () => {
    const s = await student('plan_free', false)
    const res = await api.get('/api/v1/plan?vestibularSlug=enem').set('Authorization', s.auth)
    expect(res.status).toBe(402)
    expect(res.body.teaser.daysLeft).toBeGreaterThan(0)
  })

  it('Plus com data escolhida: tarefas de hoje dentro do tempo diário, revisão do caderno primeiro', async () => {
    const s = await student('plan_plus', true)
    const saved = await api.patch('/api/v1/users/me').set('Authorization', s.auth).send({ preferences: { examDate: '2027-11-07', targetScore: 700, dailyStudyMinutes: 45 } })
    expect(saved.status).toBe(200)
    const topic = await testPrisma.topic.findFirstOrThrow({ where: { subject: { vestibular: { slug: 'enem' } } } })
    await testPrisma.reviewItem.create({ data: { userId: s.userId, questionKey: 'k1', sourceQuestionId: 'x', topicId: topic.id, dueAt: new Date(Date.now() - 1000) } })
    const res = await api.get('/api/v1/plan?vestibularSlug=enem').set('Authorization', s.auth)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ examDate: '2027-11-07', estimatedDate: false, target: 700, dailyMinutes: 45 })
    expect(res.body.today[0]).toMatchObject({ kind: 'review', href: '/erros' })
    expect(res.body.today.reduce((sum: number, t: { minutes: number }) => sum + t.minutes, 0)).toBeLessThanOrEqual(45 + 300)
    expect(res.body.week).toHaveLength(7)
    expect(res.body.week[0].label).toBe('Seg')
    expect(res.body.areas).toHaveLength(4)
  })

  it('última semana: só revisão', async () => {
    const s = await student('plan_eve', true)
    const plan = await buildPlan(s.userId, 'enem', new Date('2027-11-03T15:00:00Z'))
    expect(plan.phase).toBe('vespera')
    expect(plan.today.every((t) => t.kind === 'vespera')).toBe(true)
  })
})
