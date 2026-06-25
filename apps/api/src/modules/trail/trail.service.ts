import { prisma } from '../../lib/prisma'
import { makeError } from '../../utils/errors'

interface TopicProgressShape {
  masteryLevel: number
  unlocked: boolean
  completed: boolean
  sessionsCount: number
  answeredQuestionsCount: number
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
    answeredTopics: number
    inProgressTopics: number
    completedTopics: number
    totalSessions: number
    finishedSessions: number
    answeredQuestions: number
    studyTimeMs: number
    weeklyAnsweredQuestions: number[]
    totalXpEarned: number
  }
}

interface TopicActivity {
  answeredQuestionsCount: number
  finishedSessionsCount: number
  sessionsCount: number
}

interface TrailActivity {
  activityMap: Map<string, TopicActivity>
  totalSessions: number
  finishedSessions: number
  answeredQuestions: number
  studyTimeMs: number
  weeklyAnsweredQuestions: number[]
}

class TrailService {
  private getOrderedTopicIds(vestibular: {
    subjects: Array<{ topics: Array<{ id: string }> }>
  }): string[] {
    return vestibular.subjects.flatMap((subject) => subject.topics.map((topic) => topic.id))
  }

  private async normalizeLinearProgress(
    userId: string,
    topicIds: string[],
    activityMap: Map<string, TopicActivity>,
  ): Promise<void> {
    if (topicIds.length === 0) return

    await prisma.userTopicProgress.createMany({
      data: topicIds.map((topicId) => ({ userId, topicId, unlocked: false })),
      skipDuplicates: true,
    })

    const records = await prisma.userTopicProgress.findMany({
      where: { userId, topicId: { in: topicIds } },
    })
    const progressMap = new Map(records.map((p) => [p.topicId, p]))

    let chainOpen = true
    for (const topicId of topicIds) {
      const progress = progressMap.get(topicId)
      const completed = progress?.completed ?? false
      const hasActivity =
        completed
        || (progress?.sessionsCount ?? 0) > 0
        || (activityMap.get(topicId)?.sessionsCount ?? 0) > 0
      const shouldBeUnlocked = chainOpen || hasActivity

      if (progress?.unlocked !== shouldBeUnlocked) {
        await prisma.userTopicProgress.update({
          where: { userId_topicId: { userId, topicId } },
          data: { unlocked: shouldBeUnlocked },
        })
      }

      chainOpen = chainOpen && completed
    }
  }

  private getWeekStart(): Date {
    const start = new Date()
    const day = (start.getDay() + 6) % 7
    start.setHours(0, 0, 0, 0)
    start.setDate(start.getDate() - day)
    return start
  }

  private async getTrailActivity(
    userId: string,
    topicIds: string[],
  ): Promise<TrailActivity> {
    const sessions = await prisma.quizSession.findMany({
      where: { userId, topicId: { in: topicIds } },
      select: {
        topicId: true,
        finishedAt: true,
        answers: { select: { id: true, answeredAt: true, timeSpentMs: true } },
      },
    })

    const activityMap = new Map<string, TopicActivity>()
    const weekStart = this.getWeekStart()
    const weeklyAnsweredQuestions = [0, 0, 0, 0, 0, 0, 0]

    let finishedSessions = 0
    let answeredQuestions = 0
    let studyTimeMs = 0

    for (const session of sessions) {
      const current = activityMap.get(session.topicId) ?? {
        answeredQuestionsCount: 0,
        finishedSessionsCount: 0,
        sessionsCount: 0,
      }

      current.sessionsCount += 1
      current.answeredQuestionsCount += session.answers.length
      answeredQuestions += session.answers.length

      if (session.finishedAt) {
        current.finishedSessionsCount += 1
        finishedSessions += 1
      }

      for (const answer of session.answers) {
        studyTimeMs += answer.timeSpentMs

        if (answer.answeredAt >= weekStart) {
          const dayIndex = (answer.answeredAt.getDay() + 6) % 7
          weeklyAnsweredQuestions[dayIndex] += 1
        }
      }

      activityMap.set(session.topicId, current)
    }

    return {
      activityMap,
      totalSessions: sessions.length,
      finishedSessions,
      answeredQuestions,
      studyTimeMs,
      weeklyAnsweredQuestions,
    }
  }

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

    const topicIds = this.getOrderedTopicIds(vestibular)
    const activity = await this.getTrailActivity(userId, topicIds)
    const { activityMap } = activity
    await this.normalizeLinearProgress(userId, topicIds, activityMap)

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
        const activity = activityMap.get(topic.id)
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
            sessionsCount: Math.max(prog?.sessionsCount ?? 0, activity?.finishedSessionsCount ?? 0),
            answeredQuestionsCount: activity?.answeredQuestionsCount ?? 0,
            lastSeenAt: prog?.lastSeenAt?.toISOString() ?? null,
          },
        }
      }),
    }))

    const allTopics = subjects.flatMap((s) => s.topics)
    const totalTopics = allTopics.length
    const unlockedTopics = allTopics.filter((t) => t.progress.unlocked).length
    const answeredTopics = allTopics.filter((t) => (
      t.progress.sessionsCount > 0 || t.progress.answeredQuestionsCount > 0
    )).length
    const completedTopics = allTopics.filter((t) => t.progress.completed).length
    const inProgressTopics = allTopics.filter((t) => (
      !t.progress.completed && (t.progress.sessionsCount > 0 || t.progress.answeredQuestionsCount > 0)
    )).length

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
      summary: {
        totalTopics,
        unlockedTopics,
        answeredTopics,
        inProgressTopics,
        completedTopics,
        totalSessions: activity.totalSessions,
        finishedSessions: activity.finishedSessions,
        answeredQuestions: activity.answeredQuestions,
        studyTimeMs: activity.studyTimeMs,
        weeklyAnsweredQuestions: activity.weeklyAnsweredQuestions,
        totalXpEarned,
      },
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
