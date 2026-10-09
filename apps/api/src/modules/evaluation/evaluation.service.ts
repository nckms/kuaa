import { prisma } from '../../lib/prisma'
import { calculateSusScore, evaluationSchema, type EvaluationInput } from './evaluation.schemas'

const select = {
  id: true, answers: true, score: true, feedback: true, createdAt: true, updatedAt: true,
} as const

export const evaluationService = {
  getMine(userId: string) {
    return prisma.usabilityEvaluation.findUnique({ where: { userId }, select })
  },

  saveMine(userId: string, input: EvaluationInput) {
    const { answers, feedback } = evaluationSchema.parse(input)
    const data = { answers, score: calculateSusScore(answers), feedback: feedback || null }
    return prisma.usabilityEvaluation.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
      select,
    })
  },
}
