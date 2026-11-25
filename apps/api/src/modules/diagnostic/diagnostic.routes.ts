import { randomUUID } from 'node:crypto'
import { Router } from 'express'
import type { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { requireAuth } from '../../middleware/requireAuth'
import { makeError } from '../../utils/errors'
import { getCuratedQuestions } from '../quiz/curatedQuestions'
import { getQuestionMedia, readQuestionMedia } from '../quiz/questionMedia'
import { OFFICIAL_SIBLINGS } from '../quiz/official'
import type { QuestionOption } from '../quiz/quiz.types'
import { invalidateTrailCache } from '../trail/trail.service'
import { rewardReferral } from '../engagement/referrals'
import { nextDiagnosticItem, profileSchema, readDiagnostic, summarizeDiagnostic, type DiagnosticArea, type DiagnosticItem, type DiagnosticState } from './diagnostic.engine'

export const diagnosticRouter = Router()
diagnosticRouter.use(requireAuth)

async function enrollment(userId: string, slug: string, db = prisma) {
  const record = await db.enrollment.findFirst({ where: { userId, vestibular: { slug } },
    include: { vestibular: { include: { subjects: { orderBy: { order: 'asc' }, include: { topics: { orderBy: { order: 'asc' } } } } } } } })
  if (!record) throw makeError('Matricule-se neste vestibular primeiro.', 403, 'NOT_ENROLLED')
  return record
}
type Enrollment = Awaited<ReturnType<typeof enrollment>>

/** Questões oficiais por área no diagnóstico (escala 1–5 do banco → 1–3 do diagnóstico). */
export const OFFICIAL_PER_AREA = 8
const toDiagnosticDifficulty = (difficulty: number, source: string | null) => (!source ? 2 : difficulty <= 2 ? 1 : difficulty >= 4 ? 3 : 2)
const shuffle = <T>(items: T[]) => items.map((item) => ({ item, r: Math.random() })).sort((a, b) => a.r - b.r).map(({ item }) => item)

async function officialPool(record: Enrollment, areas: DiagnosticArea[]): Promise<DiagnosticItem[]> {
  const owner = new Map<string, { topicId: string; subjectId: string; subjectName: string; area: string }>()
  for (const area of areas) {
    for (const subject of record.vestibular.subjects.filter((s) => area.subjectIds.includes(s.id))) {
      for (const topic of subject.topics) {
        for (const name of [topic.name, ...(OFFICIAL_SIBLINGS[topic.name] ?? [])]) {
          if (!owner.has(name)) owner.set(name, { topicId: topic.id, subjectId: subject.id, subjectName: subject.name, area: area.key })
        }
      }
    }
  }
  if (!owner.size) return []
  const rows = await prisma.question.findMany({
    where: { source: 'OFFICIAL', generatedForSessionId: null, officialRefId: null, active: true, topic: { name: { in: [...owner.keys()] } } },
    select: { body: true, options: true, difficulty: true, difficultySource: true, origin: true, imageUrl: true, media: true, topic: { select: { name: true } } },
  })
  // Diagnóstico curto: prefere enunciados de leitura rápida e com dificuldade já estimada.
  const ranked = shuffle(rows).sort((a, b) => Number(a.body.length > 1400) - Number(b.body.length > 1400)
    || Number(!a.difficultySource) - Number(!b.difficultySource))
  return areas.flatMap((area) => {
    const inArea = ranked.filter((q) => owner.get(q.topic.name)?.area === area.key)
    const picked: typeof inArea = []
    const bySubject = new Map<string, typeof inArea>()
    for (const q of inArea) bySubject.set(owner.get(q.topic.name)!.subjectId, [...(bySubject.get(owner.get(q.topic.name)!.subjectId) ?? []), q])
    // Alterna as matérias da área para o diagnóstico não ficar só em uma.
    while (picked.length < OFFICIAL_PER_AREA && [...bySubject.values()].some((list) => list.length)) {
      for (const list of bySubject.values()) if (list.length && picked.length < OFFICIAL_PER_AREA) picked.push(list.shift()!)
    }
    return picked.map((q) => {
      const where = owner.get(q.topic.name)!
      const options = q.options as unknown as QuestionOption[]
      return { id: randomUUID(), body: q.body, explanation: '', origin: q.origin, ...where,
        difficulty: toDiagnosticDifficulty(q.difficulty, q.difficultySource),
        options: record.vestibular.slug === 'unicamp' ? options.filter((o, index) => o.isCorrect || index !== options.findIndex((x) => !x.isCorrect)) : options,
        ...readQuestionMedia(q.imageUrl, q.media) }
    })
  })
}
function publicState(record: Enrollment, state = readDiagnostic(record.diagnostic)) {
  const question = state?.pool.find((item) => item.id === state.currentId)
  return {
    status: !state ? 'profile' : state.finishedAt ? 'completed' : 'questions',
    profile: state?.profile ?? null,
    subjects: record.vestibular.subjects.map(({ id, name }) => ({ id, name })),
    total: 12, answered: state?.answers.length ?? 0,
    question: question ? { id: question.id, body: question.body, subjectName: question.subjectName, origin: question.origin ?? null,
      options: question.options.map(({ id, text }) => ({ id, text })), ...getQuestionMedia(question) } : null,
    result: state?.finishedAt ? { areas: summarizeDiagnostic(state), recommendedMinutes: Math.round(state.profile.weeklyMinutes / 5), finishedAt: state.finishedAt } : null,
  }
}
const toJson = (value: DiagnosticState) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue

diagnosticRouter.get('/:slug', async (req, res, next) => {
  try { res.json(publicState(await enrollment(req.userId!, String(req.params.slug)))) } catch (error) { next(error) }
})

diagnosticRouter.post('/:slug/profile', async (req, res, next) => {
  try {
    const profile = profileSchema.parse(req.body)
    const record = await enrollment(req.userId!, String(req.params.slug))
    if (profile.difficultSubjects.some((id) => !record.vestibular.subjects.some((subject) => subject.id === id))) {
      throw makeError('Materia invalida para este vestibular.', 400, 'INVALID_SUBJECT')
    }
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! }, select: { preferences: true } })
    const language = (user.preferences as { enemLanguage?: string }).enemLanguage ?? 'ingles'
    const groups = [
      { key: 'linguagens', name: 'Linguagens', slugs: ['linguagens', 'portugues', 'lingua-portuguesa', 'artes', 'educacao-fisica', record.vestibular.slug === 'enem' ? language : 'ingles'] },
      { key: 'matematica', name: 'Matematica', slugs: ['matematica'] },
      { key: 'natureza', name: 'Ciencias da Natureza', slugs: ['fisica', 'quimica', 'biologia'] },
      { key: 'humanas', name: 'Ciencias Humanas', slugs: ['historia', 'geografia', 'filosofia', 'sociologia', 'atualidades'] },
    ]
    const areas = groups
      .map((group) => ({ key: group.key, name: group.name,
        subjectIds: record.vestibular.subjects.filter((s) => group.slugs.includes(s.slug)).map((s) => s.id) }))
    const official = await officialPool(record, areas)
    const seen = new Set<string>()
    const curated = areas.flatMap((area) => record.vestibular.subjects.filter((s) => area.subjectIds.includes(s.id))
      .flatMap((subject) => subject.topics.flatMap((topic) => getCuratedQuestions(topic.name).filter((q) => {
        if (seen.has(q.body)) return false
        seen.add(q.body)
        return true
      }).map((q) => ({ ...q, id: randomUUID(), topicId: topic.id, subjectId: subject.id, subjectName: subject.name, area: area.key,
        options: record.vestibular.slug === 'unicamp' ? q.options.filter((o, index) => o.isCorrect || index !== q.options.findIndex((x) => !x.isCorrect)) : q.options,
      })))))
    // Questões reais primeiro; as autorais só completam áreas com poucas questões oficiais.
    const pool = [...official, ...curated.filter((q) => official.filter((o) => o.area === q.area).length < 6)]
    if (areas.some((area) => pool.filter((q) => q.area === area.key).length < Math.ceil(12 / areas.length))) {
      throw makeError('Diagnostico ainda nao disponivel para este vestibular.', 503, 'DIAGNOSTIC_UNAVAILABLE')
    }
    const state: DiagnosticState = { version: 1, profile, areas, pool, answers: [], currentId: null, finishedAt: null }
    state.currentId = nextDiagnosticItem(state)!.id
    const saved = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Enrollment" WHERE id = ${record.id} FOR UPDATE`
      const latest = await tx.enrollment.findUniqueOrThrow({ where: { id: record.id } })
      if (latest.diagnostic) return readDiagnostic(latest.diagnostic)!
      await tx.enrollment.update({ where: { id: record.id }, data: { diagnostic: toJson(state) } })
      return state
    })
    res.json(publicState(record, saved))
  } catch (error) { next(error) }
})

diagnosticRouter.post('/:slug/answer', async (req, res, next) => {
  try {
    const input = z.object({ questionId: z.string().min(1), optionId: z.enum(['A', 'B', 'C', 'D', 'E']).nullable() }).strict().parse(req.body)
    const record = await enrollment(req.userId!, String(req.params.slug))
    const saved = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Enrollment" WHERE id = ${record.id} FOR UPDATE`
      const latest = await tx.enrollment.findUniqueOrThrow({ where: { id: record.id } })
      const state = readDiagnostic(latest.diagnostic)
      if (!state) throw makeError('Preencha seu perfil primeiro.', 409, 'PROFILE_REQUIRED')
      const previous = state.answers.find((answer) => answer.questionId === input.questionId)
      if (previous) {
        if (previous.optionId !== input.optionId) throw makeError('Resposta ja registrada.', 409, 'ANSWER_CONFLICT')
        return state
      }
      if (state.finishedAt || state.currentId !== input.questionId) throw makeError('Atualize o diagnostico para continuar.', 409, 'STALE_QUESTION')
      const question = state.pool.find((q) => q.id === state.currentId)!
      if (input.optionId !== null && !question.options.some((o) => o.id === input.optionId)) throw makeError('Alternativa invalida.', 400, 'INVALID_OPTION')
      state.answers.push(input)
      state.currentId = nextDiagnosticItem(state)?.id ?? null
      if (state.answers.length === 12) state.finishedAt = new Date().toISOString()
      if (!state.currentId && !state.finishedAt) throw makeError('Questoes insuficientes.', 503, 'DIAGNOSTIC_UNAVAILABLE')
      await tx.enrollment.update({ where: { id: record.id }, data: { diagnostic: toJson(state) } })
      return state
    })
    await invalidateTrailCache(req.userId!, record.vestibular.slug)
    // Convite: diagnóstico concluído libera os 7 dias de Plus (idempotente).
    if (saved.finishedAt) await rewardReferral(req.userId!).catch((error) => console.warn('[Referral]', (error as Error).message))
    res.json(publicState(record, saved))
  } catch (error) { next(error) }
})
