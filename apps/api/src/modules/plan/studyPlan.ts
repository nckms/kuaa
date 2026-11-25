// Plano até a prova (Kuaa Plus): o que fazer hoje e nesta semana até a data da prova, montado a
// partir do estado atual do aluno (caderno de erros, trilha, pontos fracos, nota TRI). É recalculado
// a cada acesso, então se o aluno falta um dia ou vai mal num tópico, o plano de hoje já se ajusta.
import { Router, type NextFunction, type Request, type Response } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { requireAuth } from '../../middleware/requireAuth'
import { makeError } from '../../utils/errors'
import { effectivePlan } from '../plans/entitlements'
import { trailService } from '../trail/trail.service'

const DAY = 86_400_000
const BRT = 3 * 3600_000
/** Datas estimadas (o aluno ajusta). ENEM costuma ser nos dois primeiros domingos de novembro. */
export const DEFAULT_EXAM_DATE: Record<string, string> = { enem: '2027-11-07', fuvest: '2027-11-21', unicamp: '2027-10-31' }

type Area = 'LC' | 'CH' | 'CN' | 'MT'
const AREA_LABEL: Record<Area, string> = { LC: 'Linguagens', CH: 'Ciências Humanas', CN: 'Ciências da Natureza', MT: 'Matemática' }
const AREA_OF_SUBJECT: Record<string, Area> = {
  matematica: 'MT', fisica: 'CN', quimica: 'CN', biologia: 'CN', historia: 'CH', geografia: 'CH', filosofia: 'CH', sociologia: 'CH', atualidades: 'CH',
  linguagens: 'LC', portugues: 'LC', 'lingua-portuguesa': 'LC', artes: 'LC', 'educacao-fisica': 'LC', ingles: 'LC', espanhol: 'LC', literatura: 'LC',
}

export type Phase = 'base' | 'treino' | 'reta-final' | 'vespera'
export function phaseOf(daysLeft: number): Phase {
  return daysLeft <= 7 ? 'vespera' : daysLeft <= 30 ? 'reta-final' : daysLeft <= 120 ? 'treino' : 'base'
}
const PHASE_TEXT: Record<Phase, string> = {
  base: 'Fase de base: conteúdo novo e prática diária, com revisão dos erros.',
  treino: 'Fase de treino: mais questões no ritmo da prova e provas anteriores completas a cada duas semanas.',
  'reta-final': 'Reta final: provas completas toda semana e foco nos seus pontos fracos. Pouco conteúdo novo.',
  vespera: 'Última semana: só revisão. Nada de conteúdo novo; durma bem.',
}

export interface PlanTask { kind: 'review' | 'practice' | 'reinforce' | 'simulado' | 'exam' | 'essay' | 'vespera'; title: string; detail: string; minutes: number; href?: string; topicId?: string }

/** Dia da semana no horário de Brasília (0 = domingo). */
const weekday = (now: Date) => new Date(now.getTime() - BRT).getUTCDay()

const WEEK_FOCUS: Record<Phase, string[]> = {
  base: ['Descanso ou prova anterior (quinzenal)', 'Área mais fraca', 'Segunda área mais fraca', 'Redação', 'Revisão do caderno de erros', 'Área mais fraca', 'Simulado da semana'],
  treino: ['Prova anterior completa (quinzenal)', 'Área mais fraca', 'Segunda área mais fraca', 'Redação', 'Revisão do caderno de erros', 'Área mais fraca', 'Simulado da semana'],
  'reta-final': ['Prova anterior completa', 'Área mais fraca', 'Revisão do caderno de erros', 'Redação', 'Segunda área mais fraca', 'Revisão do caderno de erros', 'Simulado da semana'],
  vespera: ['Descanso', 'Revisão leve', 'Revisão leve', 'Revisão leve', 'Revisão leve', 'Descanso', 'Descanso'],
}

export async function buildPlan(userId: string, slug: string, now = new Date()) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { preferences: true } })
  const prefs = (user.preferences ?? {}) as { examDate?: string; targetScore?: number; dailyStudyMinutes?: number }
  const examDateStr = prefs.examDate ?? DEFAULT_EXAM_DATE[slug] ?? DEFAULT_EXAM_DATE.enem!
  const examDate = new Date(`${examDateStr}T12:00:00-03:00`)
  const daysLeft = Math.max(0, Math.ceil((examDate.getTime() - now.getTime()) / DAY))
  const phase = phaseOf(daysLeft)
  const budget = prefs.dailyStudyMinutes ?? 30
  const trail = await trailService.getTrail(userId, slug)

  // Pontos fracos por área: nota TRI mais recente; sem prova feita, acerto na trilha.
  const latestExam = await prisma.examAttempt.findFirst({ where: { userId, finishedAt: { not: null } }, orderBy: { finishedAt: 'desc' }, select: { scores: true } })
  const tri = new Map(((latestExam?.scores as Array<{ area: Area; score: number }> | null) ?? []).map((s) => [s.area, s.score]))
  const acc = new Map<Area, { ok: number; total: number }>()
  for (const s of trail.subjects) {
    const area = AREA_OF_SUBJECT[s.slug]
    if (!area) continue
    for (const t of s.topics) {
      const a = t.activity
      if (!a.recentAnswersCount || a.recentAccuracy == null) continue
      const row = acc.get(area) ?? { ok: 0, total: 0 }
      row.ok += a.recentAccuracy * a.recentAnswersCount; row.total += a.recentAnswersCount
      acc.set(area, row)
    }
  }
  const target = prefs.targetScore ?? null
  const areas = (Object.keys(AREA_LABEL) as Area[]).map((area) => {
    const a = acc.get(area)
    return { area, label: AREA_LABEL[area], score: tri.get(area) ?? null, accuracy: a?.total ? Math.round((a.ok / a.total) * 100) : null, target }
  })
  const weakness = (x: (typeof areas)[number]) => x.score ?? (x.accuracy != null ? 300 + x.accuracy * 5 : 650)
  const weakest = [...areas].sort((a, b) => weakness(a) - weakness(b))

  const dueReviews = await prisma.reviewItem.count({ where: { userId, resolvedAt: null, dueAt: { lte: now } } })
  const openReviews = await prisma.reviewItem.count({ where: { userId, resolvedAt: null } })
  const tasks: PlanTask[] = []
  const add = (t: PlanTask) => { if (tasks.reduce((s, x) => s + x.minutes, 0) + t.minutes <= Math.max(budget, 20) || tasks.length === 0) tasks.push(t) }
  const day = weekday(now)

  if (phase === 'vespera') {
    if (openReviews) tasks.push({ kind: 'vespera', title: `Revisar o caderno de erros (${openReviews})`, detail: 'Sem conteúdo novo: reveja o que você já errou.', minutes: Math.min(40, openReviews * 2), href: '/erros' })
    for (const g of trail.summary.knowledgeGaps.slice(0, 2)) tasks.push({ kind: 'vespera', title: `Reler a explicação de ${g.topicName}`, detail: `${g.subjectName} · ${g.accuracy}% de acerto. Leitura leve, sem maratona.`, minutes: 10, href: `/estudar/${g.topicId}` })
  } else {
    if (dueReviews) add({ kind: 'review', title: `Revisar ${dueReviews} ${dueReviews === 1 ? 'questão' : 'questões'} do caderno de erros`, detail: 'Primeiro o que vence hoje: é o que mais rende por minuto.', minutes: Math.min(20, dueReviews * 2), href: '/erros' })
    if (day === 6) add({ kind: 'simulado', title: 'Simulado da semana', detail: '30 questões no ritmo do ENEM, 3 minutos por questão.', minutes: 90, href: '/simulado' })
    const examDay = day === 0 && (phase === 'reta-final' || (phase === 'treino' && Math.floor(daysLeft / 7) % 2 === 0))
    if (examDay) add({ kind: 'exam', title: 'Prova anterior completa', detail: `Um dia de prova do ENEM, no tempo real. Foco: ${weakest[0]!.label}.`, minutes: 300, href: '/provas' })
    if (day === 3) add({ kind: 'essay', title: 'Escrever uma redação', detail: 'Uma proposta nova, com correção por competência.', minutes: 60, href: `/redacao/${slug}` })
    const rec = trail.recommendation
    const recTopic = rec ? trail.subjects.flatMap((s) => s.topics.map((t) => ({ t, s }))).find((x) => x.t.id === rec.topicId) : undefined
    if (recTopic) add({ kind: 'practice', title: `Praticar ${recTopic.t.name}`, detail: `${recTopic.s.name} · ${rec!.reason}`, minutes: 15, topicId: recTopic.t.id })
    const focusArea = day === 2 ? weakest[1] : weakest[0]
    const gap = trail.summary.knowledgeGaps.find((g) => g.topicId !== rec?.topicId && (!focusArea || AREA_OF_SUBJECT[trail.subjects.find((s) => s.name === g.subjectName)?.slug ?? ''] === focusArea.area))
      ?? trail.summary.knowledgeGaps.find((g) => g.topicId !== rec?.topicId)
    if (gap) add({ kind: 'reinforce', title: `Reforçar ${gap.topicName}`, detail: `${gap.subjectName} · ${gap.accuracy}% de acerto nas últimas questões.`, minutes: 15, topicId: gap.topicId })
  }

  const order = (d: number) => (d + 6) % 7 // segunda primeiro
  const week = WEEK_FOCUS[phase].map((focus, d) => ({ day: d, label: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d]!, focus: focus.replace('Área mais fraca', weakest[0]!.label).replace('Segunda área mais fraca', weakest[1]!.label), today: d === day }))
    .sort((a, b) => order(a.day) - order(b.day))
  return {
    examDate: examDateStr, estimatedDate: !prefs.examDate, daysLeft, weeksLeft: Math.floor(daysLeft / 7), phase, phaseText: PHASE_TEXT[phase],
    dailyMinutes: budget, target, today: tasks, week, areas: weakest,
  }
}

async function getPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = z.string().min(1).default('enem').parse(req.query.vestibularSlug ?? 'enem')
    const userId = req.userId!
    const enrolled = await prisma.enrollment.findFirst({ where: { userId, vestibular: { slug } } })
    if (!enrolled) throw makeError('Matricule-se neste vestibular primeiro.', 403, 'NOT_ENROLLED')
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { plan: true, planExpiresAt: true, preferences: true } })
    if (effectivePlan(user) !== 'PLUS') {
      const examDateStr = (user.preferences as { examDate?: string } | null)?.examDate ?? DEFAULT_EXAM_DATE[slug] ?? DEFAULT_EXAM_DATE.enem!
      const daysLeft = Math.max(0, Math.ceil((new Date(`${examDateStr}T12:00:00-03:00`).getTime() - Date.now()) / DAY))
      res.status(402).json({ error: 'O plano até a prova é do Kuaa Plus.', code: 'PLUS_REQUIRED', upgrade: '/planos', teaser: { examDate: examDateStr, daysLeft } })
      return
    }
    res.json(await buildPlan(userId, slug))
  } catch (err) { next(err) }
}

export const planRouter = Router()
planRouter.get('/', requireAuth, getPlan)
