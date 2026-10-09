import { describe, expect, it } from 'vitest'
import { computeNewLevel } from '../services/adaptive/DifficultyEngine'
import { recommendTopic, summarizeActivity, type LearningAnswer } from '../services/adaptive/RecommendationEngine'

const now = new Date('2026-09-29T12:00:00Z')
function answers(count: number, correct: boolean, age = 0, difficulty = 2, timeSpentMs = 30000): LearningAnswer[] {
  return Array.from({ length: count }, (_, index) => ({
    difficulty, isCorrect: correct, timeSpentMs,
    answeredAt: new Date(now.getTime() - age - index * 1000),
  }))
}
function topic(id: string, evidence: LearningAnswer[] = [], completed = false, unlocked = true) {
  return { id, progress: { masteryLevel: completed ? 3 : 0, completed, unlocked }, activity: summarizeActivity(evidence, now) }
}

describe('adaptive pure', () => {
  it('keeps three-argument compatibility without jumping to mastery', () => {
    expect(computeNewLevel(0, 1, 2)).toBe(1)
    expect(computeNewLevel(2, 1, 1)).toBe(2)
    expect(computeNewLevel(2, 1, 2)).toBe(3)
  })
  it('does not promote or penalize blank/insufficient evidence', () => {
    expect(computeNewLevel(2, 1, 2, { answeredCount: 0 })).toBe(2)
    expect(computeNewLevel(2, 0, 2, { answeredCount: 0 })).toBe(2)
    expect(computeNewLevel(2, 1, 2, { answeredCount: 1 })).toBe(2)
    expect(computeNewLevel(2, 0, 2)).toBe(2)
  })
  it('reduces at most one level only on errors at an appropriate difficulty', () => {
    expect(computeNewLevel(3, 0.2, 3, { answeredCount: 5 })).toBe(2)
    expect(computeNewLevel(3, 0.2, 5, { answeredCount: 5 })).toBe(3)
  })
  it('does not punish slow correct answers or reward implausibly fast ones', () => {
    expect(computeNewLevel(2, 1, 2, { answeredCount: 5, averageTimeMs: 900000 })).toBe(3)
    expect(computeNewLevel(2, 1, 2, { answeredCount: 5, averageTimeMs: 100 })).toBe(2)
  })
  it('bounds levels and ignores invalid performance', () => {
    expect(computeNewLevel(5, 1, 5)).toBe(5)
    expect(computeNewLevel(0, 0, 1, { answeredCount: 5 })).toBe(0)
    expect(computeNewLevel(2, NaN, 2)).toBe(2)
    expect(computeNewLevel(2, 1, 0)).toBe(2)
  })
  it('uses sequence on cold start and returns null for an empty/completed trail', () => {
    expect(recommendTopic([topic('first'), topic('locked', [], false, false)])?.topicId).toBe('first')
    expect(recommendTopic([])).toBeNull()
    expect(recommendTopic([topic('done', [], true)])).toBeNull()
  })
  it('requires sufficient evidence and never equates one correct answer with mastery', () => {
    const single = topic('single', answers(1, true))
    expect(recommendTopic([topic('first'), topic('weak', answers(4, false))])?.topicId).toBe('first')
    expect(recommendTopic([single])?.kind).toBe('continue')
    expect(single.progress.completed).toBe(false)
  })
  it('prioritizes reinforcement beyond sequence, including completed topics', () => {
    const weak = topic('weak', answers(5, false), true, false)
    expect(recommendTopic([topic('first'), weak])).toMatchObject({ topicId: 'weak', kind: 'reinforcement', targetDifficulty: 1 })
    expect(weak.progress).toMatchObject({ completed: true, masteryLevel: 3, unlocked: false })
  })
  it('reverses priority when sufficient recent evidence shows recovery', () => {
    const recovered = topic('recovered', [...answers(10, true), ...answers(20, false, 86400000)], true)
    expect(recovered.activity.recentAnswersCount).toBe(10)
    expect(recommendTopic([topic('next'), recovered])?.topicId).toBe('next')
    const relapsed = topic('relapsed', [...answers(10, false), ...answers(20, true, 86400000)], true)
    expect(recommendTopic([topic('next'), relapsed])?.topicId).toBe('relapsed')
  })
  it('ignores stale and future evidence', () => {
    expect(summarizeActivity([...answers(5, false, 31 * 86400000), ...answers(5, false, -86400000)], now).recentAnswersCount).toBe(0)
  })
  it('uses time only alongside errors and difficulty', () => {
    expect(recommendTopic([topic('first'), topic('slow', answers(5, true, 0, 2, 900000))])?.topicId).toBe('first')
    const fast = topic('fast', answers(5, false))
    const slow = topic('slow', answers(5, false, 0, 2, 900000))
    expect(recommendTopic([fast, slow])?.topicId).toBe('slow')
    expect(recommendTopic([fast, slow])?.reason).toContain('mais tempo')
  })
  it('keeps all tied simulado timestamps and does not invent answer timing', () => {
    const evidence = answers(15, false).map((answer) => ({ ...answer, answeredAt: now, timeSpentMs: null }))
    expect(summarizeActivity(evidence, now)).toMatchObject({ recentAnswersCount: 15, timedAnswersCount: 0, recentAverageTimeMs: null })
  })
})

// Default execution uses the existing integration harness. The isolated pure run
// explicitly skips this block and disables config loading, so it cannot touch DB.
describe.skipIf(process.env.ADAPTIVE_PURE_ONLY === '1')('adaptive endpoints', () => {
  it('shares choice/reason, unlocks simulado reinforcement, preserves completion and recovers', async () => {
    const { api, registerAndLogin } = await import('./helpers/api')
    const { testPrisma } = await import('./helpers/truncate')
    const { invalidateTrailCache } = await import('../modules/trail/trail.service')
    const auth = await registerAndLogin(`adaptive_${Date.now()}`)
    const get = (path: string) => api.get(path).set('Authorization', `Bearer ${auth.token}`)
    const vestibular = await testPrisma.vestibular.findUniqueOrThrow({ where: { slug: 'enem' } })
    try {
      expect((await get('/api/v1/trail/enem')).status).toBe(403)
      expect((await api.post('/api/v1/enrollments').set('Authorization', `Bearer ${auth.token}`)
        .send({ vestibularId: vestibular.id })).status).toBe(201)
      const initial = await get('/api/v1/trail/enem')
      expect(initial.status).toBe(200)
      const topics = initial.body.subjects.flatMap((subject: { topics: Array<{ id: string }> }) => subject.topics)
      const targetId = topics[topics.length - 1].id as string
      const target = await testPrisma.topic.findUniqueOrThrow({ where: { id: targetId }, include: { subject: true } })
      const finishedAt = new Date(Date.now() - 60000)
      const questions = Array.from({ length: 10 }, (_, index) => ({
        id: `adaptive-${index}`, order: index, topicId: targetId, difficulty: 2,
        subjectId: target.subjectId, subjectName: target.subject.name, subjectSlug: target.subject.slug,
        body: 'Teste', options: [{ id: 'A', text: 'Certa', isCorrect: true }, { id: 'B', text: 'Errada', isCorrect: false }],
      }))
      const attempt = await testPrisma.simuladoAttempt.create({ data: {
        userId: auth.userId, vestibularId: vestibular.id, weekStart: finishedAt,
        startedAt: new Date(finishedAt.getTime() - 300000),
        questions, answers: Object.fromEntries(questions.map((q) => [q.id, 'B'])),
      } })
      await invalidateTrailCache(auth.userId, 'enem')
      expect((await get('/api/v1/trail/enem')).body.recommendation.topicId).toBe(topics[0].id)
      await testPrisma.simuladoAttempt.update({ where: { id: attempt.id }, data: { finishedAt } })
      await invalidateTrailCache(auth.userId, 'enem')
      const trail = await get('/api/v1/trail/enem')
      const next = await get('/api/v1/trail/enem/next')
      expect(trail.status).toBe(200)
      expect(next.status).toBe(200)
      expect(next.body.recommendation).toEqual(trail.body.recommendation)
      expect(next.body.message).toBe(trail.body.recommendation.reason)
      expect(next.body.topic.id).toBe(targetId)
      expect(next.body.topic.progress).toMatchObject({ unlocked: true, completed: false, masteryLevel: 0 })
      expect(next.body.topic.activity).toMatchObject({ recentAnswersCount: 10, recentAccuracy: 0, recentAverageDifficulty: 2, recentAverageTimeMs: null })
      expect(trail.body.summary.studyTimeMs).toBe(300000)
      await testPrisma.userTopicProgress.update({ where: { userId_topicId: { userId: auth.userId, topicId: targetId } }, data: { completed: true, masteryLevel: 3 } })
      await invalidateTrailCache(auth.userId, 'enem')
      expect((await get('/api/v1/trail/enem/next')).body.topic.id).toBe(targetId)
      await testPrisma.simuladoAttempt.create({ data: {
        userId: auth.userId, vestibularId: vestibular.id, weekStart: new Date(),
        startedAt: new Date(Date.now() - 1000), finishedAt: new Date(),
        questions, answers: Object.fromEntries(questions.map((q) => [q.id, 'A'])),
      } })
      await invalidateTrailCache(auth.userId, 'enem')
      expect((await get('/api/v1/trail/enem/next')).body.topic.id).toBe(topics[0].id)
      const preserved = await testPrisma.userTopicProgress.findUniqueOrThrow({ where: { userId_topicId: { userId: auth.userId, topicId: targetId } } })
      expect(preserved).toMatchObject({ completed: true, masteryLevel: 3, unlocked: true })
    } finally {
      await invalidateTrailCache(auth.userId, 'enem')
      await testPrisma.enrollment.deleteMany({ where: { userId: auth.userId } })
      await testPrisma.userTopicProgress.deleteMany({ where: { userId: auth.userId } })
      await testPrisma.refreshToken.deleteMany({ where: { userId: auth.userId } })
      await testPrisma.user.delete({ where: { id: auth.userId } })
      await testPrisma.$disconnect()
    }
  })
})
