import { Queue } from 'bullmq'
import { prisma } from '../../lib/prisma'
import { redis } from '../../lib/redis'
import { makeError } from '../../utils/errors'
import { computeNewLevel } from '../../services/adaptive/DifficultyEngine'
import { getBullMQConnection } from '../../lib/bullmqConnection'
import type { GenerateInput, AnswerInput } from './quiz.schemas'
import type { AnswerResult, SessionSummary, AchievementData, QuestionOption, ReviewQuestion } from './quiz.types'

const quizQueue = new Queue('quiz-generation', { connection: getBullMQConnection() })

class QuizService {
  async generate(userId: string, input: GenerateInput): Promise<{ jobId: string; sessionId: string }> {
    const { topicId, count } = input

    // Buscar topic com subject e vestibular
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: { subject: { include: { vestibular: true } } },
    })
    if (!topic) throw makeError('Tópico não encontrado', 404, 'NOT_FOUND')

    // Verificar matrícula
    const enrollment = await prisma.enrollment.findUnique({
      where: { userId_vestibularId: { userId, vestibularId: topic.subject.vestibularId } },
    })
    if (!enrollment) throw makeError('Você não está matriculado neste vestibular', 403, 'NOT_ENROLLED')

    // Verificar progresso desbloqueado
    const progress = await prisma.userTopicProgress.findUnique({
      where: { userId_topicId: { userId, topicId } },
    })
    if (!progress?.unlocked) throw makeError('Tópico bloqueado', 403, 'TOPIC_LOCKED')

    // Buscar erros recentes para contexto da IA
    const recentErrors = await prisma.userAnswer.findMany({
      where: { userId, isCorrect: false },
      orderBy: { answeredAt: 'desc' },
      take: 10,
      include: { question: { include: { topic: true } } },
    })
    const recentErrorTopics = [...new Set(recentErrors.map((a) => a.question.topic.name))].slice(0, 3)

    // Criar sessão
    const session = await prisma.quizSession.create({
      data: { userId, topicId },
    })

    // Enfileirar job
    const job = await quizQueue.add('generate', {
      sessionId: session.id,
      userId,
      topicId,
      topicName: topic.name,
      subjectName: topic.subject.name,
      vestibularName: topic.subject.vestibular.name,
      userMasteryLevel: progress.masteryLevel,
      recentErrorTopics,
      questionCount: count,
    })

    if (!job.id) throw makeError('Erro ao enfileirar geração', 500, 'QUEUE_ERROR')

    return { jobId: job.id, sessionId: session.id }
  }

  async getJobStatus(jobId: string, sessionId: string): Promise<{ status: string; sessionId?: string; message?: string }> {
    const ready = await redis.get(`session:ready:${sessionId}`)
    if (ready) return { status: 'ready', sessionId }

    const error = await redis.get(`session:error:${sessionId}`)
    if (error) return { status: 'error', message: error }

    const job = await quizQueue.getJob(jobId)
    if (!job) return { status: 'error', message: 'Job não encontrado' }

    const state = await job.getState()
    if (state === 'failed') return { status: 'error', message: 'Geração falhou' }

    return { status: 'pending' }
  }

  async getSession(userId: string, sessionId: string) {
    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: {
        topic: {
          include: {
            subject: { include: { vestibular: true } },
            questions: { where: { active: true }, orderBy: { createdAt: 'asc' } },
          },
        },
        answers: { select: { questionId: true } },
      },
    })

    if (!session) throw makeError('Sessão não encontrada', 404, 'NOT_FOUND')
    if (session.userId !== userId) throw makeError('Acesso negado', 403, 'FORBIDDEN')
    if (session.finishedAt) throw makeError('Sessão já finalizada', 400, 'SESSION_FINISHED')

    // Remover isCorrect das options antes de enviar
    const questions = session.topic.questions.map((q) => {
      const opts = q.options as unknown as QuestionOption[]
      return {
        id: q.id,
        body: q.body,
        imageUrl: q.imageUrl,
        options: opts.map(({ id, text }) => ({ id, text })),
        difficulty: q.difficulty,
      }
    })

    return {
      sessionId: session.id,
      topicId: session.topicId,
      topicName: session.topic.name,
      subjectName: session.topic.subject.name,
      vestibularName: session.topic.subject.vestibular.name,
      vestibularSlug: session.topic.subject.vestibular.slug,
      questions,
      answeredIds: session.answers.map((a) => a.questionId),
    }
  }

  async answer(userId: string, sessionId: string, input: AnswerInput): Promise<AnswerResult> {
    const { questionId, optionId, timeSpentMs } = input

    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: { answers: { select: { questionId: true } } },
    })
    if (!session) throw makeError('Sessão não encontrada', 404, 'NOT_FOUND')
    if (session.userId !== userId) throw makeError('Acesso negado', 403, 'FORBIDDEN')
    if (session.finishedAt) throw makeError('Sessão já finalizada', 400, 'SESSION_FINISHED')

    // Verificar se já respondeu
    const alreadyAnswered = session.answers.some((a) => a.questionId === questionId)
    if (alreadyAnswered) throw makeError('Questão já respondida', 400, 'ALREADY_ANSWERED')

    // Buscar questão
    const question = await prisma.question.findUnique({ where: { id: questionId } })
    if (!question) throw makeError('Questão não encontrada', 404, 'NOT_FOUND')
    if (question.topicId !== session.topicId) throw makeError('Questão não pertence a esta sessão', 400, 'INVALID_QUESTION')

    // Verificar resposta
    const options = question.options as unknown as QuestionOption[]
    const selectedOption = options.find((o) => o.id === optionId)
    if (!selectedOption) throw makeError('Opção inválida', 400, 'INVALID_OPTION')

    const isCorrect = selectedOption.isCorrect
    const correctOption = options.find((o) => o.isCorrect)!

    // Calcular XP (verificar streak de 3 corretas)
    const recentAnswers = await prisma.userAnswer.findMany({
      where: { userId, sessionId },
      orderBy: { answeredAt: 'desc' },
      take: 2,
    })
    const isPerfectStreak = isCorrect && recentAnswers.length >= 2 && recentAnswers.every((a) => a.isCorrect)
    const xpDelta = isCorrect ? (isPerfectStreak ? 6 : 4) : 0

    // Transação: criar resposta, atualizar sessão e usuário
    const user = await prisma.$transaction(async (tx) => {
      await tx.userAnswer.create({
        data: { userId, questionId, sessionId, optionId, isCorrect, timeSpentMs },
      })

      await tx.quizSession.update({
        where: { id: sessionId },
        data: {
          correct: { increment: isCorrect ? 1 : 0 },
          wrong: { increment: isCorrect ? 0 : 1 },
          xpEarned: { increment: xpDelta },
        },
      })

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          xp: { increment: xpDelta },
          hearts: isCorrect ? undefined : { decrement: 1 },
        },
      })

      return updatedUser
    })

    const progress = await prisma.userTopicProgress.findUnique({
      where: { userId_topicId: { userId, topicId: session.topicId } },
    })

    return {
      isCorrect,
      correctOptionId: correctOption.id,
      explanation: question.explanation,
      xpDelta,
      heartsRemaining: Math.max(0, user.hearts),
      masteryLevel: progress?.masteryLevel ?? 0,
    }
  }

  async finish(userId: string, sessionId: string): Promise<SessionSummary> {
    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: {
        answers: {
          include: { question: true },
          orderBy: { answeredAt: 'asc' },
        },
        topic: {
          include: {
            subject: { include: { vestibular: true } },
            questions: { where: { active: true } },
          },
        },
      },
    })

    if (!session) throw makeError('Sessão não encontrada', 404, 'NOT_FOUND')
    if (session.userId !== userId) throw makeError('Acesso negado', 403, 'FORBIDDEN')
    if (session.finishedAt) throw makeError('Sessão já finalizada', 400, 'SESSION_FINISHED')

    const { correct, wrong } = session
    const total = correct + wrong
    const accuracy = total > 0 ? correct / total : 0
    const isPerfect = total > 0 && accuracy === 1.0
    const bonusXp = isPerfect ? 10 : 0
    const xpEarned = session.xpEarned + bonusXp

    // Buscar progresso atual
    const progress = await prisma.userTopicProgress.findUnique({
      where: { userId_topicId: { userId, topicId: session.topicId } },
    })
    const currentMastery = progress?.masteryLevel ?? 0

    // Calcular questões respondidas para difficulty média
    const avgDifficulty = session.answers.length > 0
      ? session.answers.reduce((acc, a) => {
          const q = a.question
          return acc + (q.difficulty ?? 2)
        }, 0) / session.answers.length
      : 2

    const newMasteryLevel = computeNewLevel(currentMastery, accuracy, avgDifficulty)
    const completed = newMasteryLevel >= 3

    // Atualizar progresso do tópico
    await prisma.userTopicProgress.update({
      where: { userId_topicId: { userId, topicId: session.topicId } },
      data: {
        masteryLevel: newMasteryLevel,
        sessionsCount: { increment: 1 },
        lastSeenAt: new Date(),
        completed,
      },
    })

    // Desbloquear próximo tópico se completou
    if (completed) {
      const nextTopic = await prisma.topic.findFirst({
        where: {
          subjectId: session.topic.subjectId,
          order: session.topic.order + 1,
        },
      })
      if (nextTopic) {
        await prisma.userTopicProgress.upsert({
          where: { userId_topicId: { userId, topicId: nextTopic.id } },
          create: { userId, topicId: nextTopic.id, unlocked: true },
          update: { unlocked: true },
        })
      }
    }

    // Verificar achievements
    const totalAnswers = await prisma.userAnswer.count({ where: { userId } })
    const totalSessions = await prisma.quizSession.count({ where: { userId, finishedAt: { not: null } } })
    const userRecord = await prisma.user.findUnique({ where: { id: userId } })

    const achievementSlugs: string[] = []
    if (totalSessions === 1) achievementSlugs.push('first_flight')
    if (isPerfect) achievementSlugs.push('perfect_wing')
    if ((userRecord?.streakDays ?? 0) >= 7) achievementSlugs.push('week_streak')
    if (totalAnswers >= 100) achievementSlugs.push('century')

    const newAchievements: AchievementData[] = []
    for (const slug of achievementSlugs) {
      const achievement = await prisma.achievement.findUnique({ where: { slug } })
      if (!achievement) continue
      const exists = await prisma.userAchievement.findUnique({
        where: { userId_achievementId: { userId, achievementId: achievement.id } },
      })
      if (!exists) {
        await prisma.userAchievement.create({
          data: { userId, achievementId: achievement.id },
        })
        await prisma.user.update({ where: { id: userId }, data: { xp: { increment: achievement.xpBonus } } })
        newAchievements.push({
          slug: achievement.slug,
          name: achievement.name,
          description: achievement.description,
          iconSlug: achievement.iconSlug,
          xpBonus: achievement.xpBonus,
        })
      }
    }

    // Verificar level up
    const updatedUser = await prisma.user.findUnique({ where: { id: userId } })
    const currentLevel = updatedUser?.level ?? 1
    const newLevel = Math.floor(Math.sqrt((updatedUser?.xp ?? 0) / 100)) + 1
    const levelUp = newLevel > currentLevel

    if (levelUp) {
      await prisma.user.update({ where: { id: userId }, data: { level: newLevel } })
    }

    // Atualizar streak
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const lastActivity = updatedUser?.lastActivityAt
    const wasYesterday = lastActivity && (() => {
      const d = new Date(lastActivity)
      d.setHours(0, 0, 0, 0)
      return today.getTime() - d.getTime() === 86400000
    })()
    const wasToday = lastActivity && (() => {
      const d = new Date(lastActivity)
      d.setHours(0, 0, 0, 0)
      return d.getTime() === today.getTime()
    })()

    if (!wasToday) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          lastActivityAt: new Date(),
          streakDays: wasYesterday ? { increment: 1 } : 1,
          longestStreak: wasYesterday
            ? { set: Math.max(updatedUser?.longestStreak ?? 0, (updatedUser?.streakDays ?? 0) + 1) }
            : undefined,
        },
      })
    }

    // Finalizar sessão
    await prisma.quizSession.update({
      where: { id: sessionId },
      data: { finishedAt: new Date(), xpEarned, isPerfect },
    })

    // Montar review questions
    const reviewQuestions: ReviewQuestion[] = session.answers.map((a) => {
      const opts = a.question.options as unknown as QuestionOption[]
      return {
        id: a.question.id,
        body: a.question.body,
        options: opts,
        userAnswerId: a.optionId,
        isCorrect: a.isCorrect,
        explanation: a.question.explanation,
      }
    })

    return {
      sessionId,
      topicName: session.topic.name,
      vestibularSlug: session.topic.subject.vestibular.slug,
      xpEarned,
      correct,
      wrong,
      skipped: session.skipped,
      isPerfect,
      accuracy,
      newMasteryLevel,
      newAchievements,
      levelUp,
      newLevel: levelUp ? newLevel : currentLevel,
      questions: reviewQuestions,
    }
  }
}

export const quizService = new QuizService()
