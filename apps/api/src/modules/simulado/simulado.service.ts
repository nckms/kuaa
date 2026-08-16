import { randomUUID } from 'crypto'
import { prisma } from '../../lib/prisma'
import { makeError } from '../../utils/errors'
import { generateFallbackQuestions } from '../quiz/fallbackQuestions'
import type { GenerationJobData } from '../quiz/quiz.types'

const TOTAL_QUESTIONS = 45
export const SIMULADO_DURATION_SECONDS = 90 * 60

// Stored in SimuladoAttempt.questions — includes isCorrect for server-side scoring.
// isCorrect is NEVER sent to the client (stripped in formatAttempt).
interface StoredOption {
  id: string
  text: string
  isCorrect: boolean
}

interface StoredQuestion {
  id: string
  order: number
  subjectId: string
  subjectName: string
  subjectSlug: string
  body: string
  options: StoredOption[]
}

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
            where: { active: true },
            select: { id: true, body: true, options: true },
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
    questions: s.topics.flatMap((t) => t.questions),
  }))

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

  for (let si = 0; si < perSubject.length; si++) {
    const subj = perSubject[si]!
    const need = allocated[si]!
    const available = shuffleArray(subj.questions)

    // ── Questions from the DB ────────────────────────────────────────────────
    for (const q of available.slice(0, need)) {
      selected.push({
        id: q.id,
        order: 0,
        subjectId: subj.id,
        subjectName: subj.name,
        subjectSlug: subj.slug,
        body: q.body,
        // options from DB already contain isCorrect — keep it for server-side scoring
        options: q.options as unknown as StoredOption[],
      })
    }

    // ── Generate missing questions with fallback ──────────────────────────────
    const missing = need - Math.min(need, available.length)
    if (missing > 0 && subj.firstTopic) {
      const jobData: GenerationJobData = {
        sessionId: 'simulado-gen',
        userId: 'system',
        topicId: subj.firstTopic.id,
        topicName: subj.firstTopic.name,
        subjectName: subj.name,
        vestibularName,
        userMasteryLevel: 2,
        recentErrorTopics: [],
        questionCount: missing,
      }
      const generated = generateFallbackQuestions(jobData)
      for (const q of generated.slice(0, missing)) {
        selected.push({
          id: randomUUID(), // inline ID — not in Question table, used only within this attempt
          order: 0,
          subjectId: subj.id,
          subjectName: subj.name,
          subjectSlug: subj.slug,
          body: q.body,
          options: q.options, // already has isCorrect from fallback generator
        })
      }
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
      options: q.options.map(({ id, text }) => ({ id, text })),
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
  return attempt ? formatAttempt(attempt) : null
}

export async function getAttempt(attemptId: string, userId: string) {
  const attempt = await prisma.simuladoAttempt.findFirst({
    where: { id: attemptId, userId },
    include: vestibularInclude,
  })
  return attempt ? formatAttempt(attempt) : null
}

export async function saveAnswer(
  attemptId: string,
  userId: string,
  questionId: string,
  optionId: string,
) {
  const attempt = await prisma.simuladoAttempt.findFirst({
    where: { id: attemptId, userId, finishedAt: null },
    select: { answers: true },
  })
  if (!attempt) return null

  const answers = { ...(attempt.answers as unknown as Record<string, string>), [questionId]: optionId }
  await prisma.simuladoAttempt.update({ where: { id: attemptId }, data: { answers } })
  return { ok: true }
}

export async function toggleFlag(attemptId: string, userId: string, questionId: string) {
  const attempt = await prisma.simuladoAttempt.findFirst({
    where: { id: attemptId, userId, finishedAt: null },
    select: { flagged: true },
  })
  if (!attempt) return null

  const flagged = attempt.flagged as unknown as string[]
  const idx = flagged.indexOf(questionId)
  if (idx >= 0) flagged.splice(idx, 1)
  else flagged.push(questionId)

  await prisma.simuladoAttempt.update({ where: { id: attemptId }, data: { flagged } })
  return { flagged }
}

export async function finishSimulado(attemptId: string, userId: string) {
  const attempt = await prisma.simuladoAttempt.findFirst({
    where: { id: attemptId, userId, finishedAt: null },
    select: { questions: true, answers: true },
  })
  if (!attempt) return null

  const questions = attempt.questions as unknown as StoredQuestion[]
  const answers = attempt.answers as unknown as Record<string, string>

  // isCorrect is stored in the attempt JSON — no need to query the Question table.
  const correctMap = new Map<string, string>()
  for (const q of questions) {
    const correct = q.options.find((o) => o.isCorrect)
    if (correct) correctMap.set(q.id, correct.id)
  }

  let correct = 0
  let wrong = 0
  for (const q of questions) {
    const chosen = answers[q.id]
    if (!chosen) continue
    if (correctMap.get(q.id) === chosen) correct++
    else wrong++
  }

  const total = questions.length
  const score = total > 0 ? Math.round(300 + 700 * (correct / total)) : 300

  const updated = await prisma.simuladoAttempt.update({
    where: { id: attemptId },
    data: { finishedAt: new Date(), score, correct, wrong },
  })

  return { score, correct, wrong, total, finishedAt: updated.finishedAt }
}
