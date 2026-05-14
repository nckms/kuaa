import { prisma } from '../../lib/prisma'
import { makeError } from '../../utils/errors'

interface TopicProgressShape {
  masteryLevel: number
  unlocked: boolean
  completed: boolean
  sessionsCount: number
  lastSeenAt: string | null
}

interface TrailTopicShape {
  id: string
  name: string
  description: string
  order: number
  xpReward: number
  progress: TopicProgressShape
}

interface TrailSubjectShape {
  id: string
  name: string
  slug: string
  iconSlug: string
  order: number
  topics: TrailTopicShape[]
}

interface TrailShape {
  vestibular: { id: string; slug: string; name: string; institution: string }
  subjects: TrailSubjectShape[]
  summary: {
    totalTopics: number
    unlockedTopics: number
    completedTopics: number
    totalXpEarned: number
  }
}

class TrailService {
  async getTrail(userId: string, vestibularSlug: string): Promise<TrailShape> {
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId, vestibular: { slug: vestibularSlug } },
    })
    if (!enrollment) throw makeError('Você não está matriculado neste vestibular', 403, 'NOT_ENROLLED')

    const vestibular = await prisma.vestibular.findUnique({
      where: { slug: vestibularSlug },
      include: {
        subjects: {
          orderBy: { order: 'asc' },
          include: { topics: { orderBy: { order: 'asc' } } },
        },
      },
    })
    if (!vestibular) throw makeError('Vestibular não encontrado', 404, 'NOT_FOUND')

    const topicIds = vestibular.subjects.flatMap((s) => s.topics.map((t) => t.id))

    const progressRecords = await prisma.userTopicProgress.findMany({
      where: { userId, topicId: { in: topicIds } },
    })
    const progressMap = new Map(progressRecords.map((p) => [p.topicId, p]))

    const subjects: TrailSubjectShape[] = vestibular.subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      slug: subject.slug,
      iconSlug: subject.iconSlug,
      order: subject.order,
      topics: subject.topics.map((topic) => {
        const prog = progressMap.get(topic.id)
        return {
          id: topic.id,
          name: topic.name,
          description: topic.description,
          order: topic.order,
          xpReward: topic.xpReward,
          progress: {
            masteryLevel: prog?.masteryLevel ?? 0,
            unlocked: prog?.unlocked ?? false,
            completed: prog?.completed ?? false,
            sessionsCount: prog?.sessionsCount ?? 0,
            lastSeenAt: prog?.lastSeenAt?.toISOString() ?? null,
          },
        }
      }),
    }))

    const allTopics = subjects.flatMap((s) => s.topics)
    const totalTopics = allTopics.length
    const unlockedTopics = allTopics.filter((t) => t.progress.unlocked).length
    const completedTopics = allTopics.filter((t) => t.progress.completed).length

    const xpAgg = await prisma.quizSession.aggregate({
      where: { userId, topic: { subject: { vestibularId: vestibular.id } } },
      _sum: { xpEarned: true },
    })
    const totalXpEarned = xpAgg._sum.xpEarned ?? 0

    return {
      vestibular: {
        id: vestibular.id,
        slug: vestibular.slug,
        name: vestibular.name,
        institution: vestibular.institution,
      },
      subjects,
      summary: { totalTopics, unlockedTopics, completedTopics, totalXpEarned },
    }
  }

  async getNextTopic(userId: string, vestibularSlug: string) {
    const trail = await this.getTrail(userId, vestibularSlug)

    for (const subject of trail.subjects) {
      for (const topic of subject.topics) {
        if (topic.progress.unlocked && !topic.progress.completed) {
          return { topic, subject, message: null }
        }
      }
    }

    return { topic: null, subject: null, message: 'Trilha concluída!' }
  }
}

export const trailService = new TrailService()
