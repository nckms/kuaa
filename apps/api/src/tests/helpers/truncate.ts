import { PrismaClient } from '@prisma/client'
import { authLimitStores } from '../../middleware/authRateLimit'

const prisma = new PrismaClient()

/**
 * Limpa todos os dados de usuário entre testes.
 * Preserva Vestibular, Subject, Topic e Achievement (dados do seed).
 */
export async function truncateUserData(): Promise<void> {
  for (const store of authLimitStores) await store.resetAll()
  // Ordem respeita FK constraints
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "UserAchievement",
      "UserAnswer",
      "UserTopicProgress",
      "QuizSession",
      "Question",
      "Enrollment",
      "RefreshToken",
      "User"
    CASCADE
  `)
}

export { prisma as testPrisma }
