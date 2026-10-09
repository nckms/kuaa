import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { redis } from '../../lib/redis'
import { ai } from '../../lib/gemini'
import { env } from '../../lib/env'
import { makeError } from '../../utils/errors'
import { computeNewLevel } from '../../services/adaptive/DifficultyEngine'
import type { GenerateInput, AnswerInput } from './quiz.schemas'
import type { AnswerResult, SessionSummary, AchievementData, QuestionOption, ReviewQuestion, GenerationJobData } from './quiz.types'
import { generateCuratedQuestions as generateFallbackQuestions } from './curatedQuestions'
import { invalidateTrailCache, trailService } from '../trail/trail.service'
import { captureSnapshot } from '../index/index.service'
import { buildFewShotContext, selectReferences, validateGeneratedQuestions, PROMPT_VERSION } from './fewShot'

/** Fisher-Yates shuffle das opções de uma questão.
 *  Re-atribui os IDs A-E em ordem para que letra e posição sempre coincidam.
 *  O flag isCorrect acompanha o conteúdo da opção — garantia real independente da IA. */
export function shuffleOptions<T extends { id: string; isCorrect: boolean }>(options: T[]): T[] {
  const arr = [...options]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  const letters = ['A', 'B', 'C', 'D', 'E']
  return arr.map((opt, i) => ({ ...opt, id: letters[i] ?? opt.id }))
}

interface GenerationResult {
  questions: ReturnType<typeof generateFallbackQuestions>
  source: 'AI_GENERATED' | 'CURATED'
  metadata: Prisma.InputJsonObject
}

function isGemini503(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const e = err as unknown as Record<string, unknown>
  if (e['status'] === 503) return true
  return err.message.includes('"code":503') || err.message.includes('"status":"UNAVAILABLE"')
}

function describeGeminiError(err: unknown): string {
  if (!(err instanceof Error)) return 'erro desconhecido'
  const e = err as unknown as Record<string, unknown>
  const status = e['status']
  if (typeof status === 'number') return `HTTP ${status}`
  return err.message.slice(0, 100)
}

async function generateQuestions(data: GenerationJobData): Promise<GenerationResult> {
  const hasApiKey = !!env.GEMINI_API_KEY?.trim()
  const references = selectReferences(data)
  const optionCount = data.vestibularSlug === 'unicamp' ? 4 : 5
  const metadata = { promptVersion: PROMPT_VERSION, referenceIds: references.map((ref) => ref.id), model: env.GEMINI_MODEL, targetDifficulty: data.targetDifficulty ?? 1 }
  const fallback = (reason: string): GenerationResult => ({
    questions: generateFallbackQuestions(data).map((question) => ({
      ...question,
      options: optionCount === 4
        ? question.options.filter((option, index) => option.isCorrect || index !== question.options.findIndex((item) => !item.isCorrect))
        : question.options,
    })),
    source: 'CURATED', metadata: { ...metadata, source: 'CURATED', fallbackReason: reason },
  })

  if (!hasApiKey) return fallback('AI_NOT_CONFIGURED')

  const systemPrompt = `Voce e um professor especialista em vestibulares brasileiros.
Gere questoes de multipla escolha no padrao do vestibular solicitado.

REGRAS OBRIGATORIAS:
1. Linguagem acessivel para estudantes de escolas publicas
2. Contextos da realidade brasileira contemporanea
3. Exatamente ${optionCount} alternativas (${optionCount === 4 ? 'A-D' : 'A-E'}), apenas 1 correta
4. difficulty de 1 a 5, proporcional ao masteryLevel informado
5. explanation deve ensinar o conceito, minimo 2 linhas
6. A posicao da alternativa correta DEVE variar aleatoriamente entre A, B, C, D e E ao longo das questoes geradas — nunca use um padrao fixo ou previsivel (ex: sempre B, ou A B C D E em ciclo)

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
Dificuldade alvo: ${data.targetDifficulty ?? Math.max(1, data.userMasteryLevel)}/5
Questoes a gerar: ${data.questionCount}
${data.recentErrorTopics.length > 0 ? `Topicos com dificuldade recente: ${data.recentErrorTopics.join(', ')}` : ''}`

  let timer: ReturnType<typeof setTimeout> | undefined
  const absoluteDeadline = new Promise<never>((_, reject) =>
    { timer = setTimeout(() => reject(new Error('Gemini timeout absoluto (24s)')), 24_000) },
  )

  const RETRY_BACKOFF_MS = [500, 1000]
  const MAX_ATTEMPTS = 3

  try {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model: env.GEMINI_MODEL,
          contents: `${systemPrompt}\n\n${buildFewShotContext(data, references)}\n\n${userPrompt}`,
          config: { responseMimeType: 'application/json' },
        }),
        absoluteDeadline,
      ])

      const content = response.text
      if (!content) throw new Error('Gemini retornou resposta vazia')

      const parsed = JSON.parse(content) as unknown
      const questions = validateGeneratedQuestions(parsed, data.questionCount, references, optionCount)
      return { questions, source: 'AI_GENERATED', metadata: { ...metadata, source: 'AI_GENERATED' } }
    } catch (err) {
      const isAbsoluteTimeout = err instanceof Error && err.message.startsWith('Gemini timeout absoluto')
      const is503 = isGemini503(err)

      if (isAbsoluteTimeout) {
        console.warn('[QuizService] Gemini timeout absoluto (24s), usando fallback')
        break
      }

      if (is503 && attempt < MAX_ATTEMPTS) {
        const wait = RETRY_BACKOFF_MS[attempt - 1] ?? 1000
        console.warn(`[QuizService] Gemini 503 UNAVAILABLE (tentativa ${attempt}/${MAX_ATTEMPTS}), retry em ${wait}ms`)
        await new Promise<void>((r) => setTimeout(r, wait))
        continue
      }

      const label = is503
        ? `503 UNAVAILABLE após ${attempt} tentativa(s)`
        : describeGeminiError(err)
      console.warn(`[QuizService] Gemini ${label}, usando fallback`)
      break
    }
  }
  return fallback('AI_UNAVAILABLE_OR_INVALID')
  } finally {
    if (timer) clearTimeout(timer)
  }
}

async function persistGeneratedQuestions(
  sessionId: string,
  topicId: string,
  questions: ReturnType<typeof generateFallbackQuestions>,
  source: GenerationResult['source'],
  metadata: Prisma.InputJsonObject,
): Promise<void> {
  await prisma.$transaction([prisma.question.createMany({
    data: questions.map((q) => ({
      topicId,
      generatedForSessionId: sessionId,
      body: q.body,
      options: q.options as unknown as Prisma.InputJsonValue,
      explanation: q.explanation,
      difficulty: q.difficulty,
      source,
    })),
  }), prisma.quizSession.update({ where: { id: sessionId }, data: { generationMetadata: metadata } })])
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
  const raw = await generateQuestions(data)
  // Embaralha opções de cada questão — garante distribuição aleatória independente da IA
  const questions = raw.questions.map((q) => ({ ...q, options: shuffleOptions(q.options) }))
  if (!questions.length) throw makeError('Nao ha questoes de reserva para este topico e a IA esta indisponivel. Tente outro topico.', 503, 'NO_QUESTIONS')
  await persistGeneratedQuestions(data.sessionId, data.topicId, questions, raw.source, raw.metadata)
  await markSessionReady(data.sessionId)
  return { id: `sync-${data.sessionId}` }
}

class QuizService {
  async resume(userId: string, topicId: string) {
    const session = await prisma.quizSession.findFirst({
      where: { userId, topicId, finishedAt: null, generatedQuestions: { some: { active: true } } },
      orderBy: { startedAt: 'desc' }, select: { id: true },
    })
    return session ? { sessionId: session.id, jobId: `sync-${session.id}` } : null
  }

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
    const trail = await trailService.getTrail(userId, topic.subject.vestibular.slug)

    // Verificar progresso desbloqueado
    const progress = await prisma.userTopicProgress.findUnique({
      where: { userId_topicId: { userId, topicId } },
    })
    if (!progress?.unlocked) throw makeError('Tópico bloqueado', 403, 'TOPIC_LOCKED')

    // Buscar erros recentes para contexto da IA
    const recentErrors = await prisma.userAnswer.findMany({
      where: { userId, isCorrect: false, question: { topic: { subject: { vestibularId: topic.subject.vestibularId } } } },
      orderBy: { answeredAt: 'desc' },
      take: 10,
      include: { question: { include: { topic: true } } },
    })
    const recentErrorTopics = [...new Set([
      ...trail.summary.knowledgeGaps.map((gap) => gap.topicName),
      ...recentErrors.map((a) => a.question.topic.name),
    ])].slice(0, 3)

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
      vestibularSlug: topic.subject.vestibular.slug,
      userMasteryLevel: progress.masteryLevel,
      targetDifficulty: trail.recommendation?.topicId === topicId
        ? trail.recommendation.targetDifficulty : Math.max(1, Math.min(5, progress.masteryLevel)),
      recentErrorTopics,
      questionCount: count,
    }

    let job: { id: string }
    try {
      job = await enqueueQuizGeneration(jobData)
    } catch (error) {
      await prisma.quizSession.update({ where: { id: session.id }, data: { generationMetadata: { status: 'failed' } } })
      throw error
    }

    if (!job.id) throw makeError('Erro ao enfileirar geração', 500, 'QUEUE_ERROR')

    return { jobId: job.id, sessionId: session.id }
  }

  async getJobStatus(userId: string, _jobId: string, sessionId: string): Promise<{ status: string; sessionId?: string; message?: string }> {
    const session = await prisma.quizSession.findFirst({ where: { id: sessionId, userId } })
    if (!session) throw makeError('Sessao nao encontrada', 404, 'NOT_FOUND')
    const generatedCount = await prisma.question.count({
      where: { generatedForSessionId: sessionId, active: true },
    })
    if (generatedCount > 0) return { status: 'ready', sessionId }
    if ((session.generationMetadata as { status?: string } | null)?.status === 'failed'
      || Date.now() - session.startedAt.getTime() > 120000) {
      return { status: 'error', message: 'Nao foi possivel gerar as questoes. Inicie uma nova sessao.' }
    }

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
        generatedQuestions: { where: { active: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
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
      generation: session.generationMetadata,
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
    let xpDelta = 0

    // Lock the user before the session, consistently with finish, across concurrent requests.
    const user = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`
      await tx.$queryRaw`SELECT id FROM "QuizSession" WHERE id = ${sessionId} FOR UPDATE`
      const locked = await tx.quizSession.findUniqueOrThrow({ where: { id: sessionId } })
      if (locked.finishedAt) throw makeError('Sessao ja finalizada', 400, 'SESSION_FINISHED')
      const duplicate = await tx.userAnswer.findFirst({ where: { sessionId, questionId } })
      if (duplicate) throw makeError('Questao ja respondida', 400, 'ALREADY_ANSWERED')
    const recentAnswers = await tx.userAnswer.findMany({
      where: { userId, sessionId },
      orderBy: { answeredAt: 'desc' },
      take: 2,
    })
    const isPerfectStreak = isCorrect && recentAnswers.length >= 2 && recentAnswers.every((a) => a.isCorrect)
    xpDelta = isCorrect ? (isPerfectStreak ? 6 : 4) : 0

    // Transação: criar resposta, atualizar sessão e usuário
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

      if (!isCorrect) {
        await tx.user.updateMany({
          where: { id: userId, hearts: { gt: 0 } },
          data: { hearts: { decrement: 1 } },
        })
      }

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          xp: { increment: xpDelta },
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
    const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`
    await tx.$queryRaw`SELECT id FROM "QuizSession" WHERE id = ${sessionId} FOR UPDATE`
    const session = await tx.quizSession.findUnique({
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
        generatedQuestions: { where: { active: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
      },
    })

    if (!session) throw makeError('Sessão não encontrada', 404, 'NOT_FOUND')
    if (session.userId !== userId) throw makeError('Acesso negado', 403, 'FORBIDDEN')
    if (session.finishedAt) return null

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
    const progress = await tx.userTopicProgress.findUnique({
      where: { userId_topicId: { userId, topicId: session.topicId } },
    })
    const currentMastery = progress?.masteryLevel ?? 0

    // Calcular questões respondidas para difficulty média
    const avgDifficulty = session.generatedQuestions.length > 0
      ? session.generatedQuestions.reduce((acc, q) => acc + (q.difficulty ?? 2), 0) / session.generatedQuestions.length
      : 2

    const newMasteryLevel = computeNewLevel(currentMastery, accuracy, avgDifficulty, {
      answeredCount: session.answers.length,
      averageTimeMs: session.answers.length ? session.answers.reduce((sum, answer) => sum + answer.timeSpentMs, 0) / session.answers.length : null,
    })
    const completed = (progress?.completed ?? false) || newMasteryLevel >= 3

    // Atualizar progresso do tópico
    await tx.userTopicProgress.update({
      where: { userId_topicId: { userId, topicId: session.topicId } },
      data: {
        masteryLevel: newMasteryLevel,
        sessionsCount: { increment: answeredTotal > 0 ? 1 : 0 },
        lastSeenAt: new Date(),
        completed,
      },
    })

    // Access progresses after practice; mastery still requires sufficient evidence.
    if (completed || answeredTotal > 0) {
      const subjects = await tx.subject.findMany({
        where: { vestibularId: session.topic.subject.vestibularId },
        orderBy: { order: 'asc' },
        include: { topics: { orderBy: { order: 'asc' }, select: { id: true } } },
      })
      const orderedTopics = subjects.flatMap((subject) => subject.topics)
      const currentTopicIndex = orderedTopics.findIndex((topic) => topic.id === session.topicId)
      const nextTopic = currentTopicIndex >= 0 ? orderedTopics[currentTopicIndex + 1] : null

      if (nextTopic) {
        await tx.userTopicProgress.upsert({
          where: { userId_topicId: { userId, topicId: nextTopic.id } },
          create: { userId, topicId: nextTopic.id, unlocked: true },
          update: { unlocked: true },
        })
      }
    }

    // Verificar achievements
    const totalAnswers = await tx.userAnswer.count({ where: { userId } })
    const totalSessions = await tx.quizSession.count({ where: { userId, finishedAt: { not: null }, answers: { some: {} } } })
    const userRecord = await tx.user.findUnique({ where: { id: userId } })

    const achievementSlugs: string[] = []
    if (totalSessions === 0 && answeredTotal > 0) achievementSlugs.push('first_flight')
    if (isPerfect) achievementSlugs.push('perfect_wing')
    if ((userRecord?.streakDays ?? 0) >= 7) achievementSlugs.push('week_streak')
    if (totalAnswers >= 100) achievementSlugs.push('century')

    const newAchievements: AchievementData[] = []
    for (const slug of achievementSlugs) {
      const achievement = await tx.achievement.findUnique({ where: { slug } })
      if (!achievement) continue
      const exists = await tx.userAchievement.findUnique({
        where: { userId_achievementId: { userId, achievementId: achievement.id } },
      })
      if (!exists) {
        await tx.userAchievement.create({
          data: { userId, achievementId: achievement.id },
        })
        await tx.user.update({ where: { id: userId }, data: { xp: { increment: achievement.xpBonus } } })
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
    const updatedUser = await tx.user.update({ where: { id: userId }, data: { xp: { increment: bonusXp } } })
    const currentLevel = updatedUser?.level ?? 1
    const newLevel = Math.floor(Math.sqrt((updatedUser?.xp ?? 0) / 100)) + 1
    const levelUp = newLevel > currentLevel

    if (levelUp) {
      await tx.user.update({ where: { id: userId }, data: { level: newLevel } })
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

    if (!wasToday && answeredTotal > 0) {
      await tx.user.update({
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
    await tx.quizSession.update({
      where: { id: sessionId },
      data: { finishedAt: new Date(), xpEarned, skipped, isPerfect },
    })

    // Montar review questions
    const reviewQuestions: ReviewQuestion[] = session.generatedQuestions.map((question) => {
      const answer = session.answers.find((item) => item.questionId === question.id)
      const opts = question.options as unknown as QuestionOption[]
      return {
        id: question.id,
        body: question.body,
        options: opts,
        userAnswerId: answer?.optionId ?? null,
        isCorrect: answer?.isCorrect ?? false,
        explanation: question.explanation,
      }
    })

    return { vestibularId: session.topic.subject.vestibularId, summary: {
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
    } }
    }, { timeout: 15000 })
    if (!result) return this.getSummary(userId, sessionId)
    await invalidateTrailCache(userId, result.summary.vestibularSlug)
    await captureSnapshot(userId, result.vestibularId).catch((err) => {
      console.warn('[QuizService] Falha ao capturar IndexSnapshot:', err)
    })
    return result.summary
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
        generatedQuestions: { where: { active: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
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

    const reviewQuestions: ReviewQuestion[] = session.generatedQuestions.map((question) => {
      const answer = session.answers.find((item) => item.questionId === question.id)
      const options = question.options as unknown as QuestionOption[]
      return {
        id: question.id,
        body: question.body,
        options,
        userAnswerId: answer?.optionId ?? null,
        isCorrect: answer?.isCorrect ?? false,
        explanation: question.explanation,
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
