import { execFileSync } from 'node:child_process'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { api, registerAndLogin } from './helpers/api'
import { testPrisma, truncateUserData } from './helpers/truncate'

beforeAll(truncateUserData)
afterAll(() => testPrisma.$disconnect())

describe('ENEM curriculum in the persisted learning flow', () => {
  it('re-running the seed preserves topic identity and mastery', async () => {
    const auth = await registerAndLogin('curriculum_seed')
    const exam = await testPrisma.vestibular.findUniqueOrThrow({ where: { slug: 'enem' } })
    await api.post('/api/v1/enrollments').set('Authorization', `Bearer ${auth.token}`).send({ vestibularId: exam.id })
    const topic = await testPrisma.topic.findFirstOrThrow({ where: { subject: { vestibularId: exam.id, slug: 'linguagens' }, order: 1 } })
    await testPrisma.userTopicProgress.update({ where: { userId_topicId: { userId: auth.userId, topicId: topic.id } }, data: { masteryLevel: 2, sessionsCount: 3 } })
    execFileSync(process.execPath, ['../../node_modules/ts-node/dist/bin.js', 'prisma/seed.ts'], { env: process.env, stdio: 'pipe' })
    const same = await testPrisma.topic.findUniqueOrThrow({ where: { subjectId_order: { subjectId: topic.subjectId, order: 1 } } })
    expect(same.id).toBe(topic.id)
    expect((await testPrisma.userTopicProgress.findUniqueOrThrow({ where: { userId_topicId: { userId: auth.userId, topicId: topic.id } } })).masteryLevel).toBe(2)
    const trail = await api.get('/api/v1/trail/enem').set('Authorization', `Bearer ${auth.token}`)
    expect(trail.status).toBe(200)
    expect(trail.body.subjects).toHaveLength(16)
    expect(trail.body.subjects.every((subject: { topics: { progress: { unlocked: boolean } }[] }) => subject.topics[0]?.progress.unlocked)).toBe(true)
  })
  it('uses only the selected foreign language and excludes essay training from the objective simulado', async () => {
    const auth = await registerAndLogin('curriculum_language')
    const exam = await testPrisma.vestibular.findUniqueOrThrow({ where: { slug: 'enem' } })
    await api.post('/api/v1/enrollments').set('Authorization', `Bearer ${auth.token}`).send({ vestibularId: exam.id })
    expect((await api.patch('/api/v1/users/me').set('Authorization', `Bearer ${auth.token}`).send({ preferences: { enemLanguage: 'espanhol' } })).status).toBe(200)
    const attempt = await api.post('/api/v1/simulado/enem/start').set('Authorization', `Bearer ${auth.token}`)
    expect(attempt.status).toBe(200)
    expect(attempt.body.questions).toHaveLength(45)
    const subjects = attempt.body.questions.map((question: { subjectSlug: string }) => question.subjectSlug)
    expect(subjects).toContain('espanhol')
    expect(subjects).not.toContain('ingles')
    expect(subjects).not.toContain('redacao')
  })
})
