import { randomUUID } from 'crypto'
import type { Prisma } from '@prisma/client'
import { prisma } from '../../lib/prisma'
import { makeError } from '../../utils/errors'
import { getCuratedQuestions } from '../quiz/curatedQuestions'
import { shuffleOptions } from '../quiz/quiz.service'
import { invalidateTrailCache } from '../trail/trail.service'
import { captureSnapshot } from '../index/index.service'
import { SIMULADO_DURATION_SECONDS, scoreAttempt, type StoredQuestion } from './simulado.results'

const TOTAL_QUESTIONS = 45
export { SIMULADO_DURATION_SECONDS } from './simulado.results'

/** Returns the Sunday 00:00 UTC that starts the current week */
function getCurrentWeekStart(): Date {
  const now = new Date()
  const day = now.getUTCDay() // 0 = Sunday
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - day, 0, 0, 0, 0))
}

function getNextWeekStart(): Date {
  const ws = getCurrentWeekStart()
  ws.setUTCDate(ws.getUTCDate() + 7)
  return ws
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

async function buildQuestions(vestibularId: string, vestibularName: string): Promise<StoredQuestion[]> {
  const subjects = await prisma.subject.findMany({
    where: { vestibularId },
    orderBy: { order: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      weight: true,
      topics: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          name: true,
          questions: {
            where: { active: true, generatedForSessionId: null, source: { in: ['CURATED', 'OFFICIAL'] } },
            select: { id: true, topicId: true, body: true, options: true, difficulty: true, source: true, explanation: true },
          },
        },
      },
    },
  })

  const perSubject = subjects.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    weight: s.weight,
    firstTopic: s.topics[0] ?? null,
    questions: s.topics.flatMap((topic) => [
      ...topic.questions,
      ...getCuratedQuestions(topic.name).map((question) => ({
        id: randomUUID(), topicId: topic.id, body: question.body, options: question.options,
        difficulty: question.difficulty, source: 'CURATED' as const, explanation: question.explanation,
      })),
    ]),
  })).filter((subject) => subject.firstTopic)

  if (perSubject.length === 0) {
    throw makeError('Este vestibular ainda nao possui questoes disponiveis.', 503, 'NO_QUESTIONS')
  }

  const totalWeight = perSubject.reduce((sum, s) => sum + s.weight, 0) || 1

  // Proportional allocation: floor each share, then distribute the remainder
  // to the subjects that have the most available questions (minimise fallback use).
  const allocated = perSubject.map((s) => Math.floor((s.weight / totalWeight) * TOTAL_QUESTIONS))
  let remainder = TOTAL_QUESTIONS - allocated.reduce((a, b) => a + b, 0)
  const sortedByAvail = [...perSubject.keys()].sort(
    (a, b) => perSubject[b]!.questions.length - perSubject[a]!.questions.length,
  )
  for (let i = 0; remainder > 0; i++, remainder--) {
    allocated[sortedByAvail[i % sortedByAvail.length]!]!++
  }

  const selected: StoredQuestion[] = []
  const seenBodies = new Set<string>()

  for (let si = 0; si < perSubject.length; si++) {
    const subj = perSubject[si]!
    const need = allocated[si]!
    const subjectBodies = new Set<string>()
    const available = shuffleArray(subj.questions).filter((question) => {
      const body = question.body.trim().toLowerCase()
      if (seenBodies.has(body) || subjectBodies.has(body)) return false
      subjectBodies.add(body)
      return true
    })

    // ── Questions from the DB ────────────────────────────────────────────────
    for (const q of available.slice(0, need)) {
      seenBodies.add(q.body.trim().toLowerCase())
      selected.push({
        id: q.id,
        order: 0,
        subjectId: subj.id,
        subjectName: subj.name,
        subjectSlug: subj.slug,
        topicId: q.topicId,
        difficulty: q.difficulty,
        source: q.source,
        explanation: q.explanation,
        body: q.body,
        // Embaralha opções antes de armazenar — garante posição aleatória independente da fonte
        options: shuffleOptions((q.options as unknown as StoredQuestion['options'])
          .filter((option, index, options) => !vestibularName.toLowerCase().includes('unicamp')
            || options.length === 4 || option.isCorrect || index !== options.findIndex((item) => !item.isCorrect))),
      })
    }

  }

  // Fill unused shares from the remaining pool, never duplicating a question.
  for (const subj of shuffleArray(perSubject)) {
    for (const q of shuffleArray(subj.questions)) {
      if (selected.length >= TOTAL_QUESTIONS) break
      const body = q.body.trim().toLowerCase()
      if (seenBodies.has(body)) continue
      seenBodies.add(body)
      const options = q.options as unknown as StoredQuestion['options']
      const omit = vestibularName.toLowerCase().includes('unicamp') && options.length > 4
        ? options.findIndex((option) => !option.isCorrect) : -1
      selected.push({
        id: q.id, order: 0, subjectId: subj.id, subjectName: subj.name, subjectSlug: subj.slug,
        topicId: q.topicId, difficulty: q.difficulty, source: q.source,
        explanation: q.explanation, body: q.body,
        options: shuffleOptions(options.filter((_, index) => index !== omit)),
      })
    }
  }

  // Interleave subjects for a natural exam feel
  const interleaved = shuffleArray(selected)
  interleaved.forEach((q, i) => { q.order = i + 1 })

  return interleaved
}

/** Formats an attempt for API responses — strips isCorrect from options. */
function formatAttempt(attempt: {
  id: string
  vestibular: { name: string }
  weekStart: Date
  startedAt: Date
  finishedAt: Date | null
  questions: unknown
  answers: unknown
  flagged: unknown
  score: number | null
  correct: number | null
  wrong: number | null
}) {
  const questions = attempt.questions as StoredQuestion[]
  return {
    id: attempt.id,
    vestibularName: attempt.vestibular.name,
    weekStart: attempt.weekStart,
    startedAt: attempt.startedAt,
    finishedAt: attempt.finishedAt,
    // Strip isCorrect — never expose correct answers to the client
    questions: questions.map((q) => ({
      id: q.id,
      order: q.order,
      subjectId: q.subjectId,
      subjectName: q.subjectName,
      subjectSlug: q.subjectSlug,
      body: q.body,
      source: q.source ?? 'UNKNOWN',
      options: q.options.map(({ id, text }) => ({ id, text })),
      ...(attempt.finishedAt ? {
        correctOptionId: q.options.find((option) => option.isCorrect)?.id ?? null,
        explanation: q.explanation ?? null,
      } : {}),
    })),
    answers: attempt.answers as Record<string, string>,
    flagged: attempt.flagged as string[],
    score: attempt.score,
    correct: attempt.correct,
    wrong: attempt.wrong,
    totalSeconds: SIMULADO_DURATION_SECONDS,
    nextWeekStart: getNextWeekStart(),
  }
}

const vestibularInclude = { vestibular: { select: { name: true } } }

export async function startOrGetSimulado(vestibularId: string, vestibularName: string, userId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_vestibularId: { userId, vestibularId } },
  })
  if (!enrollment) throw makeError('Voce nao esta matriculado neste vestibular.', 403, 'NOT_ENROLLED')
  const weekStart = getCurrentWeekStart()

  const existing = await prisma.simuladoAttempt.findUnique({
    where: { userId_vestibularId_weekStart: { userId, vestibularId, weekStart } },
    select: { id: true },
  })
  if (existing) {
    throw makeError(
      'Você já iniciou o simulado desta semana. Próximo disponível no próximo domingo.',
      409,
      'ALREADY_ATTEMPTED',
    )
  }

  const questions = await buildQuestions(vestibularId, vestibularName)
  if (questions.length === 0) {
    throw makeError('Nao foi possivel preparar todas as questoes. Tente novamente.', 503, 'NO_QUESTIONS')
  }

  const created = await prisma.simuladoAttempt.create({
    data: { userId, vestibularId, weekStart, questions: questions as object[], answers: {}, flagged: [] },
    include: vestibularInclude,
  })

  return formatAttempt(created)
}

export async function getCurrentAttempt(vestibularId: string, userId: string) {
  const weekStart = getCurrentWeekStart()
  const attempt = await prisma.simuladoAttempt.findUnique({
    where: { userId_vestibularId_weekStart: { userId, vestibularId, weekStart } },
    include: vestibularInclude,
  })
  if (attempt && !attempt.finishedAt && hasExpired(attempt.startedAt)) {
    await finishSimulado(attempt.id, userId)
    return getAttempt(attempt.id, userId)
  }
  return attempt ? formatAttempt(attempt) : null
}

export async function getAttempt(attemptId: string, userId: string) {
  const attempt = await prisma.simuladoAttempt.findFirst({
    where: { id: attemptId, userId },
    include: vestibularInclude,
  })
  if (attempt && !attempt.finishedAt && hasExpired(attempt.startedAt)) {
    await finishSimulado(attempt.id, userId)
    return getAttempt(attempt.id, userId)
  }
  return attempt ? formatAttempt(attempt) : null
}

function hasExpired(startedAt: Date) {
  return Date.now() >= startedAt.getTime() + SIMULADO_DURATION_SECONDS * 1000
}

async function lockAttempt(tx: Prisma.TransactionClient, attemptId: string, userId: string) {
  // Serialize JSON updates and finishing so simultaneous requests cannot lose answers.
  await tx.$queryRaw`SELECT id FROM "SimuladoAttempt" WHERE id = ${attemptId} AND "userId" = ${userId} FOR UPDATE`
  return tx.simuladoAttempt.findFirst({
    where: { id: attemptId, userId },
    include: { vestibular: { select: { slug: true } } },
  })
}

export async function saveAnswer(
  attemptId: string,
  userId: string,
  questionId: string,
  optionId: string,
) {
  return prisma.$transaction(async (tx) => {
    const attempt = await lockAttempt(tx, attemptId, userId)
    if (!attempt || attempt.finishedAt) return null
    if (hasExpired(attempt.startedAt)) throw makeError('O tempo do simulado terminou.', 409, 'TIME_EXPIRED')
    const question = (attempt.questions as unknown as StoredQuestion[]).find((q) => q.id === questionId)
    if (!question) throw makeError('Questao invalida.', 400, 'INVALID_QUESTION')
    if (!question.options.some((option) => option.id === optionId)) {
      throw makeError('Alternativa invalida.', 400, 'INVALID_OPTION')
    }
    const answers = { ...(attempt.answers as Record<string, string>), [questionId]: optionId }
    await tx.simuladoAttempt.update({ where: { id: attemptId }, data: { answers } })
    return { ok: true }
  })
}

export async function toggleFlag(attemptId: string, userId: string, questionId: string) {
  return prisma.$transaction(async (tx) => {
    const attempt = await lockAttempt(tx, attemptId, userId)
    if (!attempt || attempt.finishedAt) return null
    if (hasExpired(attempt.startedAt)) throw makeError('O tempo do simulado terminou.', 409, 'TIME_EXPIRED')
    if (!(attempt.questions as unknown as StoredQuestion[]).some((q) => q.id === questionId)) {
      throw makeError('Questao invalida.', 400, 'INVALID_QUESTION')
    }
    const flagged = [...attempt.flagged as string[]]
    const idx = flagged.indexOf(questionId)
    if (idx >= 0) flagged.splice(idx, 1)
    else flagged.push(questionId)
    await tx.simuladoAttempt.update({ where: { id: attemptId }, data: { flagged } })
    return { flagged }
  })
}

export async function finishSimulado(attemptId: string, userId: string) {
  const outcome = await prisma.$transaction(async (tx) => {
    const attempt = await lockAttempt(tx, attemptId, userId)
    if (!attempt) return null
    const result = scoreAttempt(attempt.questions as unknown as StoredQuestion[], attempt.answers as Record<string, string>)
    const finishedAt = attempt.finishedAt ?? new Date(Math.min(
      Date.now(), attempt.startedAt.getTime() + SIMULADO_DURATION_SECONDS * 1000,
    ))
    if (!attempt.finishedAt) {
      await tx.simuladoAttempt.update({
        where: { id: attemptId },
        data: { finishedAt, score: result.score, correct: result.correct, wrong: result.wrong },
      })
    }
    return { result: { ...result, finishedAt }, attempt, newlyFinished: !attempt.finishedAt }
  })
  if (!outcome) return null
  await invalidateTrailCache(userId, outcome.attempt.vestibular.slug)
  if (outcome.newlyFinished) {
    await captureSnapshot(userId, outcome.attempt.vestibularId).catch((error) => {
      console.warn('[Simulado] Falha ao registrar historico do indice:', error)
    })
  }
  return outcome.result
}
