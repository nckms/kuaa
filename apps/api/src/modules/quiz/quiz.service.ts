import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { redis } from '../../lib/redis'
import { openai } from '../../lib/openai'
import { makeError } from '../../utils/errors'
import { computeNewLevel } from '../../services/adaptive/DifficultyEngine'
import type { GenerateInput, AnswerInput } from './quiz.schemas'
import type { AnswerResult, SessionSummary, AchievementData, QuestionOption, ReviewQuestion, GenerationJobData } from './quiz.types'
import { generateFallbackQuestions } from './fallbackQuestions'
import { invalidateTrailCache } from '../trail/trail.service'

const OptionSchema = z.object({
  id: z.enum(['A', 'B', 'C', 'D', 'E']),
  text: z.string().min(1),
  isCorrect: z.boolean(),
})

const QuestionSchema = z.object({
  body: z.string().min(10),
  options: z.array(OptionSchema).length(5),
  explanation: z.string().min(20),
  difficulty: z.number().int().min(1).max(5),
})

const ResponseSchema = z.object({
  questions: z.array(QuestionSchema).min(1),
})

async function generateQuestions(data: GenerationJobData): Promise<ReturnType<typeof generateFallbackQuestions>> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  const hasApiKey = !!apiKey && apiKey.startsWith('sk-') && apiKey.length > 20

  if (!hasApiKey) return generateFallbackQuestions(data)

  const systemPrompt = `Voce e um professor especialista em vestibulares brasileiros.
Gere questoes de multipla escolha no padrao do vestibular solicitado.

REGRAS OBRIGATORIAS:
1. Linguagem acessivel para estudantes de escolas publicas
2. Contextos da realidade brasileira contemporanea
3. Exatamente 5 alternativas (A-E), apenas 1 correta
4. difficulty de 1 a 5, proporcional ao masteryLevel informado
5. explanation deve ensinar o conceito, minimo 2 linhas

Retorne APENAS JSON valido sem markdown, exatamente neste formato:
{
  "questions": [
    {
      "body": "enunciado completo",
      "options": [
        { "id": "A", "text": "alternativa", "isCorrect": false },
        { "id": "B", "text": "alternativa", "isCorrect": true },
        { "id": "C", "text": "alternativa", "isCorrect": false },
        { "id": "D", "text": "alternativa", "isCorrect": false },
        { "id": "E", "text": "alternativa", "isCorrect": false }
      ],
      "explanation": "explicacao didatica e completa",
      "difficulty": 2
    }
  ]
}`

  const userPrompt = `Vestibular: ${data.vestibularName}
Materia: ${data.subjectName}
Topico: ${data.topicName}
Nivel de dominio do aluno: ${data.userMasteryLevel}/5
Questoes a gerar: ${data.questionCount}
${data.recentErrorTopics.length > 0 ? `Topicos com dificuldade recente: ${data.recentErrorTopics.join(', ')}` : ''}`

  try {
    const aiTimeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('OpenAI timeout (8s)')), 8000),
    )
    const completion = await Promise.race([
      openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
      aiTimeout,
    ])

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('OpenAI retornou resposta vazia')

    const parsed = JSON.parse(content) as unknown
    const validated = ResponseSchema.parse(parsed)
    return validated.questions
  } catch (err) {
    const message = err instanceof Error ? err.message : 'erro desconhecido'
    console.warn(`[QuizService] Falha ao gerar com IA; usando fallback: ${message}`)
    return generateFallbackQuestions(data)
  }
}

async function persistGeneratedQuestions(
  sessionId: string,
  topicId: string,
  questions: ReturnType<typeof generateFallbackQuestions>,
): Promise<void> {
  await prisma.question.createMany({
    data: questions.map((q) => ({
      topicId,
      generatedForSessionId: sessionId,
      body: q.body,
      options: q.options as unknown as Prisma.InputJsonValue,
      explanation: q.explanation,
      difficulty: q.difficulty,
      source: 'AI_GENERATED',
    })),
  })
}

async function markSessionReady(sessionId: string): Promise<void> {
  try {
    await redis.set(`session:ready:${sessionId}`, '1', 'EX', 3600)
  } catch {
    // O status tambem consulta o banco; Redis e acelerador, nao fonte unica.
  }
}

async function getRedisValue(key: string): Promise<string | null> {
  try {
    return await redis.get(key)
  } catch {
    return null
  }
}

async function enqueueQuizGeneration(data: GenerationJobData): Promise<{ id: string }> {
  const questions = await generateQuestions(data)
  await persistGeneratedQuestions(data.sessionId, data.topicId, questions)
  await markSessionReady(data.sessionId)
  return { id: `sync-${data.sessionId}` }
}

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

    const jobData = {
      sessionId: session.id,
      userId,
      topicId,
      topicName: topic.name,
      subjectName: topic.subject.name,
      vestibularName: topic.subject.vestibular.name,
      userMasteryLevel: progress.masteryLevel,
      recentErrorTopics,
      questionCount: count,
    }

    const job = await enqueueQuizGeneration(jobData)

    if (!job.id) throw makeError('Erro ao enfileirar geração', 500, 'QUEUE_ERROR')

    return { jobId: job.id, sessionId: session.id }
  }

  async getJobStatus(_jobId: string, sessionId: string): Promise<{ status: string; sessionId?: string; message?: string }> {
    const generatedCount = await prisma.question.count({
      where: { generatedForSessionId: sessionId, active: true },
    })
    if (generatedCount > 0) return { status: 'ready', sessionId }

    const ready = await getRedisValue(`session:ready:${sessionId}`)
    if (ready) return { status: 'ready', sessionId }

    const error = await getRedisValue(`session:error:${sessionId}`)
    if (error) return { status: 'error', message: error }

    return { status: 'pending' }
  }

  async getSession(userId: string, sessionId: string) {
    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: {
        topic: {
          include: {
            subject: { include: { vestibular: true } },
          },
        },
        generatedQuestions: { where: { active: true }, orderBy: { createdAt: 'asc' } },
        answers: { include: { question: true }, orderBy: { answeredAt: 'asc' } },
      },
    })

    if (!session) throw makeError('Sessão não encontrada', 404, 'NOT_FOUND')
    if (session.userId !== userId) throw makeError('Acesso negado', 403, 'FORBIDDEN')
    if (session.finishedAt) throw makeError('Sessão já finalizada', 400, 'SESSION_FINISHED')

    if (session.generatedQuestions.length === 0) {
      throw makeError('Questoes ainda nao estao prontas', 409, 'QUESTIONS_NOT_READY')
    }

    // Remover isCorrect das options antes de enviar
    const questions = session.generatedQuestions.map((q) => {
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
      answeredResults: session.answers.map((answer) => {
        const options = answer.question.options as unknown as QuestionOption[]
        const correctOption = options.find((option) => option.isCorrect)
        return {
          questionId: answer.questionId,
          selectedOptionId: answer.optionId,
          isCorrect: answer.isCorrect,
          correctOptionId: correctOption?.id ?? answer.optionId,
          explanation: answer.question.explanation,
          xpDelta: 0,
          heartsRemaining: 0,
          masteryLevel: 0,
        }
      }),
    }
  }

  async answer(userId: string, sessionId: string, input: AnswerInput): Promise<AnswerResult> {
    const { questionId, optionId, timeSpentMs } = input

    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: {
        answers: { select: { questionId: true } },
        topic: { include: { subject: { include: { vestibular: { select: { slug: true } } } } } },
      },
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

    if (question.generatedForSessionId !== sessionId) {
      throw makeError('Questao nao pertence a esta sessao', 400, 'INVALID_QUESTION')
    }

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

    await invalidateTrailCache(userId, session.topic.subject.vestibular.slug)

    return {
      isCorrect,
      selectedOptionId: optionId,
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
          },
        },
        generatedQuestions: { where: { active: true }, orderBy: { createdAt: 'asc' } },
      },
    })

    if (!session) throw makeError('Sessão não encontrada', 404, 'NOT_FOUND')
    if (session.userId !== userId) throw makeError('Acesso negado', 403, 'FORBIDDEN')
    if (session.finishedAt) throw makeError('Sessão já finalizada', 400, 'SESSION_FINISHED')

    const { correct, wrong } = session
    const answeredQuestionIds = new Set(session.answers.map((a) => a.questionId))
    const skipped = Math.max(0, session.generatedQuestions.length - answeredQuestionIds.size)
    const answeredTotal = correct + wrong
    const totalQuestions = session.generatedQuestions.length || answeredTotal
    const accuracy = totalQuestions > 0 ? correct / totalQuestions : 0
    const isPerfect = totalQuestions > 0 && correct === totalQuestions && wrong === 0 && skipped === 0
    const bonusXp = isPerfect ? 10 : 0
    const xpEarned = session.xpEarned + bonusXp

    // Buscar progresso atual
    const progress = await prisma.userTopicProgress.findUnique({
      where: { userId_topicId: { userId, topicId: session.topicId } },
    })
    const currentMastery = progress?.masteryLevel ?? 0

    // Calcular questões respondidas para difficulty média
    const avgDifficulty = session.generatedQuestions.length > 0
      ? session.generatedQuestions.reduce((acc, q) => acc + (q.difficulty ?? 2), 0) / session.generatedQuestions.length
      : 2

    const newMasteryLevel = computeNewLevel(currentMastery, accuracy, avgDifficulty)
    const completed = (progress?.completed ?? false) || newMasteryLevel >= 3

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
      const subjects = await prisma.subject.findMany({
        where: { vestibularId: session.topic.subject.vestibularId },
        orderBy: { order: 'asc' },
        include: { topics: { orderBy: { order: 'asc' }, select: { id: true } } },
      })
      const orderedTopics = subjects.flatMap((subject) => subject.topics)
      const currentTopicIndex = orderedTopics.findIndex((topic) => topic.id === session.topicId)
      const nextTopic = currentTopicIndex >= 0 ? orderedTopics[currentTopicIndex + 1] : null

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
    if (totalSessions === 0) achievementSlugs.push('first_flight')
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
      data: { finishedAt: new Date(), xpEarned, skipped, isPerfect },
    })

    await invalidateTrailCache(userId, session.topic.subject.vestibular.slug)

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
      skipped,
      isPerfect,
      accuracy,
      newMasteryLevel,
      newAchievements,
      levelUp,
      newLevel: levelUp ? newLevel : currentLevel,
      questions: reviewQuestions,
    }
  }

  async getSummary(userId: string, sessionId: string): Promise<SessionSummary> {
    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: {
        user: { select: { level: true } },
        answers: {
          include: { question: true },
          orderBy: { answeredAt: 'asc' },
        },
        topic: {
          include: {
            subject: { include: { vestibular: true } },
          },
        },
        generatedQuestions: { where: { active: true }, orderBy: { createdAt: 'asc' } },
      },
    })

    if (!session) throw makeError('Sessao nao encontrada', 404, 'NOT_FOUND')
    if (session.userId !== userId) throw makeError('Acesso negado', 403, 'FORBIDDEN')
    if (!session.finishedAt) throw makeError('Sessao ainda nao finalizada', 409, 'SESSION_NOT_FINISHED')

    const totalQuestions = session.generatedQuestions.length || session.correct + session.wrong + session.skipped
    const accuracy = totalQuestions > 0 ? session.correct / totalQuestions : 0
    const progress = await prisma.userTopicProgress.findUnique({
      where: { userId_topicId: { userId, topicId: session.topicId } },
    })

    const reviewQuestions: ReviewQuestion[] = session.answers.map((answer) => {
      const options = answer.question.options as unknown as QuestionOption[]
      return {
        id: answer.question.id,
        body: answer.question.body,
        options,
        userAnswerId: answer.optionId,
        isCorrect: answer.isCorrect,
        explanation: answer.question.explanation,
      }
    })

    return {
      sessionId,
      topicName: session.topic.name,
      vestibularSlug: session.topic.subject.vestibular.slug,
      xpEarned: session.xpEarned,
      correct: session.correct,
      wrong: session.wrong,
      skipped: session.skipped,
      isPerfect: session.isPerfect,
      accuracy,
      newMasteryLevel: progress?.masteryLevel ?? 0,
      newAchievements: [],
      levelUp: false,
      newLevel: session.user.level,
      questions: reviewQuestions,
    }
  }
}

export const quizService = new QuizService()
