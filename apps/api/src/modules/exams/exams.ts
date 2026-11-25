// Provas anteriores: a prova oficial de um ano inteiro (ENEM dia 1 ou dia 2),
// com as questões na ordem original, tempo oficial e correção comentada.
// Independe do simulado semanal e não altera o Índice Kuaa.
import { Router, type Request, type Response, type NextFunction } from 'express'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { requireAuth } from '../../middleware/requireAuth'
import { recordExamMistakes } from '../review/review'
import { makeError } from '../../utils/errors'
import { readQuestionMedia } from '../quiz/questionMedia'
import { ensureOfficialExplanation, withTimeout } from '../quiz/official'
import type { QuestionOption } from '../quiz/quiz.types'

/** Tempo e áreas oficiais de cada dia. Até 2016 o dia 1 era Humanas + Natureza (4h30) e o dia 2, Linguagens + Matemática + redação (5h30). */
export function enemDuration(year: number, day: number): number {
  if (year >= 2017) return day === 1 ? 5.5 * 3600 : 5 * 3600
  return day === 1 ? 4.5 * 3600 : 5.5 * 3600
}
export function enemArea(year: number, day: number): string {
  if (year >= 2017) return day === 1 ? 'Linguagens e Ciências Humanas' : 'Ciências da Natureza e Matemática'
  if (year === 2009) return day === 1 ? 'Ciências da Natureza e Ciências Humanas' : 'Linguagens e Matemática'
  return day === 1 ? 'Ciências Humanas e Ciências da Natureza' : 'Linguagens e Matemática'
}

/** Número da questão e idioma a partir do id estável (cofenem2019q045ing). */
export function parseOfficialId(id: string): { year: number; number: number; language: 'ingles' | 'espanhol' | null } | null {
  const m = /^cofenem(\d{4})q(\d{3})(ing|esp)?$/.exec(id)
  if (!m) return null
  return { year: Number(m[1]), number: Number(m[2]), language: m[3] === 'ing' ? 'ingles' : m[3] === 'esp' ? 'espanhol' : null }
}
/** No ENEM, 1–90 é o dia 1 e 91–180 é o dia 2 (2009 e 2010 seguem a mesma divisão por área). */
export const dayOf = (number: number) => (number <= 90 ? 1 : 2)

async function officialIdsByYear() {
  const rows = await prisma.question.findMany({
    where: { source: 'OFFICIAL', generatedForSessionId: null, officialRefId: null, active: true, id: { startsWith: 'cofenem' } },
    select: { id: true },
  })
  return rows.map((r) => ({ id: r.id, ...parseOfficialId(r.id)! })).filter((r) => r.year)
}

async function listExams(req: Request, res: Response, next: NextFunction) {
  try {
    const ids = await officialIdsByYear()
    const attempts = await prisma.examAttempt.findMany({
      where: { userId: req.userId!, exam: 'enem' }, orderBy: { startedAt: 'desc' },
      select: { id: true, year: true, day: true, startedAt: true, finishedAt: true, correct: true, questionIds: true },
    })
    const map = new Map<string, { year: number; day: number; questions: Set<number> }>()
    for (const q of ids) {
      const key = `${q.year}-${dayOf(q.number)}`
      if (!map.has(key)) map.set(key, { year: q.year, day: dayOf(q.number), questions: new Set() })
      map.get(key)!.questions.add(q.number)
    }
    const exams = [...map.values()].sort((a, b) => b.year - a.year || a.day - b.day).map((e) => {
      const mine = attempts.filter((a) => a.year === e.year && a.day === e.day)
      const last = mine[0]
      return {
        year: e.year, day: e.day, area: enemArea(e.year, e.day), questions: e.questions.size, durationSeconds: enemDuration(e.year, e.day),
        attempts: mine.length,
        last: last ? { id: last.id, finished: Boolean(last.finishedAt), correct: last.correct, total: (last.questionIds as string[]).length, startedAt: last.startedAt } : null,
      }
    })
    res.json({ exams })
  } catch (err) { next(err) }
}

/** Parâmetro de rota como texto (Express 5 tipa como string | string[]). */
const param = (req: Request, name: string) => String(req.params[name] ?? '')

const isExpired = (a: { startedAt: Date; durationSeconds: number }) => Date.now() >= a.startedAt.getTime() + a.durationSeconds * 1000

async function startExam(req: Request, res: Response, next: NextFunction) {
  try {
    const params = z.object({ year: z.coerce.number().int().min(2009).max(2100), day: z.coerce.number().int().min(1).max(2) }).safeParse(req.params)
    if (!params.success) throw makeError('Prova inválida.', 400, 'INVALID_EXAM')
    const { year, day } = params.data
    const userId = req.userId!
    const open = await prisma.examAttempt.findFirst({ where: { userId, exam: 'enem', year, day, finishedAt: null }, orderBy: { startedAt: 'desc' } })
    if (open && !isExpired(open)) { res.json({ id: open.id }); return }
    if (open) await finish(open.id, userId)
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { preferences: true } })
    const language = (user.preferences as { enemLanguage?: string } | null)?.enemLanguage === 'espanhol' ? 'espanhol' : 'ingles'
    const ids = (await officialIdsByYear())
      .filter((q) => q.year === year && dayOf(q.number) === day && (q.language === null || q.language === language))
      .sort((a, b) => a.number - b.number)
    if (ids.length < 10) throw makeError('Esta prova ainda não está disponível.', 404, 'EXAM_NOT_FOUND')
    const attempt = await prisma.examAttempt.create({ data: {
      userId, exam: 'enem', year, day, language: ids.some((q) => q.language) ? language : null,
      questionIds: ids.map((q) => q.id), durationSeconds: enemDuration(year, day),
    } })
    res.status(201).json({ id: attempt.id })
  } catch (err) { next(err) }
}

async function loadAttempt(id: string, userId: string) {
  const attempt = await prisma.examAttempt.findFirst({ where: { id, userId } })
  if (!attempt) throw makeError('Prova não encontrada.', 404, 'NOT_FOUND')
  return attempt
}

async function finish(id: string, userId: string) {
  const mistakes: { value?: { questions: { id: string; topicId: string; options: unknown }[]; answers: Record<string, string> } } = {}
  const result = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "ExamAttempt" WHERE id = ${id} AND "userId" = ${userId} FOR UPDATE`
    const attempt = await tx.examAttempt.findFirst({ where: { id, userId } })
    if (!attempt) throw makeError('Prova não encontrada.', 404, 'NOT_FOUND')
    if (attempt.finishedAt) return attempt
    const ids = attempt.questionIds as string[]
    const answers = attempt.answers as Record<string, string>
    const questions = await tx.question.findMany({ where: { id: { in: ids } }, select: { id: true, options: true, topicId: true } })
    mistakes.value = { questions, answers }
    let correct = 0
    let wrong = 0
    for (const q of questions) {
      const chosen = answers[q.id]
      if (!chosen) continue
      if (acceptedOptionIds(q.options as unknown as QuestionOption[]).includes(chosen)) correct++
      else wrong++
    }
    const finishedAt = new Date(Math.min(Date.now(), attempt.startedAt.getTime() + attempt.durationSeconds * 1000))
    return tx.examAttempt.update({ where: { id }, data: { finishedAt, correct, wrong } })
  })
  // Erros da prova entram no caderno de erros (fora da transação: falha aqui não desfaz a entrega).
  if (mistakes.value) {
    await recordExamMistakes(userId, mistakes.value.questions, mistakes.value.answers).catch((error) => console.warn('[Review] prova:', (error as Error).message))
  }
  return result
}

/**
 * Alternativas que contam como acerto: a do gabarito e qualquer outra com o mesmo texto (a
 * transcrição de algumas provas repete a alternativa correta, e o aluno não pode perder ponto por isso).
 */
export function acceptedOptionIds(options: QuestionOption[]): string[] {
  const norm = (t: string) => t.replace(/\s+/g, ' ').trim().toLowerCase()
  const right = options.find((o) => o.isCorrect)
  return right ? options.filter((o) => o.id === right.id || norm(o.text) === norm(right.text)).map((o) => o.id) : []
}

async function getAttempt(req: Request, res: Response, next: NextFunction) {
  try {
    let attempt = await loadAttempt(param(req, 'id'), req.userId!)
    if (!attempt.finishedAt && isExpired(attempt)) attempt = await finish(attempt.id, req.userId!)
    const ids = attempt.questionIds as string[]
    const rows = await prisma.question.findMany({
      where: { id: { in: ids } },
      select: { id: true, body: true, options: true, explanation: true, explanationByAi: true, imageUrl: true, media: true, difficulty: true, difficultySource: true, origin: true,
        topic: { select: { subject: { select: { name: true, slug: true } } } } },
    })
    const byId = new Map(rows.map((r) => [r.id, r]))
    const done = Boolean(attempt.finishedAt)
    const questions = ids.flatMap((id) => {
      const q = byId.get(id)
      const meta = parseOfficialId(id)
      if (!q || !meta) return []
      const options = q.options as unknown as QuestionOption[]
      return [{
        id, order: meta.number, subjectName: q.topic.subject.name, subjectSlug: q.topic.subject.slug, body: q.body, source: 'OFFICIAL', origin: q.origin,
        ...readQuestionMedia(q.imageUrl, q.media),
        options: options.map(({ id: optionId, text }) => ({ id: optionId, text })),
        ...(done ? {
          correctOptionId: options.find((o) => o.isCorrect)?.id ?? null,
          acceptedOptionIds: acceptedOptionIds(options),
          explanation: q.explanation || null, explanationByAi: q.explanationByAi,
          difficulty: q.difficultySource ? q.difficulty : null,
        } : {}),
      }]
    })
    res.json({
      id: attempt.id, exam: 'enem', year: attempt.year, day: attempt.day, area: enemArea(attempt.year, attempt.day), language: attempt.language,
      vestibularName: `ENEM ${attempt.year} · dia ${attempt.day}`,
      startedAt: attempt.startedAt, finishedAt: attempt.finishedAt, totalSeconds: attempt.durationSeconds,
      answers: attempt.answers, flagged: attempt.flagged, correct: attempt.correct, wrong: attempt.wrong, questions,
    })
  } catch (err) { next(err) }
}

async function mutateOpen(req: Request, mutate: (attempt: Prisma.ExamAttemptGetPayload<object>) => Prisma.ExamAttemptUpdateInput) {
  const userId = req.userId!
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "ExamAttempt" WHERE id = ${param(req, 'id')} AND "userId" = ${userId} FOR UPDATE`
    const attempt = await tx.examAttempt.findFirst({ where: { id: param(req, 'id'), userId } })
    if (!attempt) throw makeError('Prova não encontrada.', 404, 'NOT_FOUND')
    if (attempt.finishedAt) throw makeError('Esta prova já foi entregue.', 409, 'FINISHED')
    if (isExpired(attempt)) throw makeError('O tempo da prova terminou.', 409, 'TIME_EXPIRED')
    return tx.examAttempt.update({ where: { id: attempt.id }, data: mutate(attempt) })
  })
}

async function answer(req: Request, res: Response, next: NextFunction) {
  try {
    const body = z.object({ questionId: z.string().max(40), optionId: z.string().regex(/^[A-E]$/) }).safeParse(req.body)
    if (!body.success) throw makeError('Resposta inválida.', 400, 'INVALID_ANSWER')
    await mutateOpen(req, (attempt) => {
      if (!(attempt.questionIds as string[]).includes(body.data.questionId)) throw makeError('Questão inválida.', 400, 'INVALID_QUESTION')
      return { answers: { ...(attempt.answers as Record<string, string>), [body.data.questionId]: body.data.optionId } }
    })
    res.json({ ok: true })
  } catch (err) { next(err) }
}

async function flag(req: Request, res: Response, next: NextFunction) {
  try {
    const questionId = z.string().max(40).safeParse(req.body?.questionId)
    if (!questionId.success) throw makeError('Questão inválida.', 400, 'INVALID_QUESTION')
    const updated = await mutateOpen(req, (attempt) => {
      if (!(attempt.questionIds as string[]).includes(questionId.data)) throw makeError('Questão inválida.', 400, 'INVALID_QUESTION')
      const list = attempt.flagged as string[]
      return { flagged: list.includes(questionId.data) ? list.filter((id) => id !== questionId.data) : [...list, questionId.data] }
    })
    res.json({ flagged: updated.flagged })
  } catch (err) { next(err) }
}

async function finishHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const done = await finish(param(req, 'id'), req.userId!)
    res.json({ correct: done.correct, wrong: done.wrong, total: (done.questionIds as string[]).length, finishedAt: done.finishedAt })
  } catch (err) { next(err) }
}

/** Explicação sob demanda na correção (a IA escreve uma vez e fica guardada para todos). */
async function explanation(req: Request, res: Response, next: NextFunction) {
  try {
    const attempt = await loadAttempt(param(req, 'id'), req.userId!)
    const questionId = param(req, 'questionId')
    if (!attempt.finishedAt) throw makeError('Entregue a prova para ver as explicações.', 409, 'NOT_FINISHED')
    if (!(attempt.questionIds as string[]).includes(questionId)) throw makeError('Questão inválida.', 400, 'INVALID_QUESTION')
    const text = await withTimeout(ensureOfficialExplanation(questionId), 20_000, '')
    res.json({ explanation: text || null, explanationByAi: Boolean(text) })
  } catch (err) { next(err) }
}

export const examsRouter = Router()
examsRouter.get('/enem', requireAuth, listExams)
examsRouter.post('/enem/:year/:day/start', requireAuth, startExam)
examsRouter.get('/attempts/:id', requireAuth, getAttempt)
examsRouter.patch('/attempts/:id/answer', requireAuth, answer)
examsRouter.patch('/attempts/:id/flag', requireAuth, flag)
examsRouter.post('/attempts/:id/finish', requireAuth, finishHandler)
examsRouter.get('/attempts/:id/questions/:questionId/explanation', requireAuth, explanation)
