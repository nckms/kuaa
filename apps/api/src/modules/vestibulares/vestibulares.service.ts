import { prisma } from '../../lib/prisma'
import { makeError } from '../../utils/errors'

class VestibularesService {
  async listAll() {
    return prisma.vestibular.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      include: {
        subjects: {
          select: { id: true, name: true, slug: true, order: true, iconSlug: true },
          orderBy: { order: 'asc' },
        },
      },
    })
  }

  async getBySlug(slug: string) {
    const vestibular = await prisma.vestibular.findFirst({
      where: { slug, active: true },
      include: {
        subjects: {
          orderBy: { order: 'asc' },
          include: {
            topics: {
              select: { id: true, name: true, order: true, xpReward: true },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })
    if (!vestibular) throw makeError('Vestibular não encontrado', 404, 'NOT_FOUND')
    return vestibular
  }

  async getStats(vestibularId: string) {
    const [totalEnrollments, totalQuestions, totalTopics] = await Promise.all([
      prisma.enrollment.count({ where: { vestibularId } }),
      prisma.question.count({
        where: { active: true, topic: { subject: { vestibularId } } },
      }),
      prisma.topic.count({ where: { subject: { vestibularId } } }),
    ])
    return { totalEnrollments, totalQuestions, totalTopics }
  }

  async getDetail(slug: string) {
    const vestibular = await this.getBySlug(slug)
    const stats = await this.getStats(vestibular.id)
    return { ...vestibular, stats }
  }
}

export const vestibularesService = new VestibularesService()
