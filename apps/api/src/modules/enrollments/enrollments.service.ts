import { prisma } from '../../lib/prisma'
import { makeError } from '../../utils/errors'

class EnrollmentsService {
  async getMyEnrollments(userId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: { vestibular: true },
    })

    return Promise.all(
      enrollments.map(async (enrollment) => {
        const [totalTopics, completedTopics] = await Promise.all([
          prisma.topic.count({
            where: { subject: { vestibularId: enrollment.vestibularId } },
          }),
          prisma.userTopicProgress.count({
            where: {
              userId,
              completed: true,
              topic: { subject: { vestibularId: enrollment.vestibularId } },
            },
          }),
        ])

        const progressPercent =
          totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0

        return {
          enrollment: {
            id: enrollment.id,
            vestibularId: enrollment.vestibularId,
            enrolledAt: enrollment.enrolledAt,
          },
          vestibular: enrollment.vestibular,
          progress: { totalTopics, completedTopics, progressPercent },
        }
      }),
    )
  }

  async enroll(userId: string, vestibularId: string) {
    const vestibular = await prisma.vestibular.findFirst({
      where: { id: vestibularId, active: true },
      include: {
        subjects: {
          orderBy: { order: 'asc' },
          include: { topics: { orderBy: { order: 'asc' } } },
        },
      },
    })
    if (!vestibular) throw makeError('Vestibular não encontrado', 404, 'NOT_FOUND')

    const existing = await prisma.enrollment.findUnique({
      where: { userId_vestibularId: { userId, vestibularId } },
    })
    if (existing) throw makeError('Você já está matriculado neste vestibular', 409, 'ALREADY_ENROLLED')

    const enrollment = await prisma.enrollment.create({ data: { userId, vestibularId } })

    const allTopicIds = vestibular.subjects.flatMap((s) => s.topics.map((t) => t.id))
    await prisma.userTopicProgress.createMany({
      data: allTopicIds.map((topicId) => ({ userId, topicId, unlocked: false })),
      skipDuplicates: true,
    })

    const firstTopic = vestibular.subjects.flatMap((s) => s.topics)[0]
    if (firstTopic) {
      await prisma.userTopicProgress.update({
        where: { userId_topicId: { userId, topicId: firstTopic.id } },
        data: { unlocked: true },
      })
    }

    return { enrollment, vestibular }
  }

  async unenroll(userId: string, enrollmentId: string) {
    const enrollment = await prisma.enrollment.findUnique({ where: { id: enrollmentId } })
    if (!enrollment) throw makeError('Matrícula não encontrada', 404, 'NOT_FOUND')
    if (enrollment.userId !== userId) throw makeError('Acesso negado', 403, 'FORBIDDEN')

    await prisma.enrollment.delete({ where: { id: enrollmentId } })
  }
}

export const enrollmentsService = new EnrollmentsService()
