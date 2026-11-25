import { verifyUnsubscribeToken } from '../engagement/weeklyEmail'
import { planSummary } from '../plans/entitlements'
import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { requireAuth } from '../../middleware/requireAuth'
import { makeError } from '../../utils/errors'
import { deleteMyAccount, exportMyData } from './account'
import { myReferral } from '../engagement/referrals'

export const usersRouter = Router()

usersRouter.get('/me/export', requireAuth, exportMyData)
usersRouter.delete('/me', requireAuth, deleteMyAccount)
usersRouter.get('/me/referral', requireAuth, myReferral)

const PreferencesSchema = z.object({
  dailyStudyMinutes: z.number().int().min(5).max(240).default(30),
  reducedMotion: z.boolean().default(false),
  highContrast: z.boolean().default(false),
  enemLanguage: z.enum(['ingles', 'espanhol']).default('ingles'),
  weeklyEmail: z.boolean().default(true),
  pushReminders: z.boolean().default(true),
  /** Data da prova (plano até a prova). Ausente = data estimada. */
  examDate: z.string().regex(/^20\d{2}-\d{2}-\d{2}$/).optional(),
  /** Meta de nota por área (plano até a prova). */
  targetScore: z.number().int().min(300).max(1000).optional(),
})

function preferencesWithDefaults(value: unknown) {
  const stored = value && typeof value === 'object' && !Array.isArray(value) ? value : {}
  return { ...PreferencesSchema.parse({}), ...stored }
}

const UpdateMeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  school: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().length(2).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  activeVestibularId: z.string().min(1).optional(),
  preferences: PreferencesSchema.partial().strict().optional(),
})

const safeSelect = {
  id: true,
  email: true,
  name: true,
  school: true,
  city: true,
  state: true,
  avatarUrl: true,
  plan: true,
  planExpiresAt: true,
  xp: true,
  level: true,
  streakDays: true,
  longestStreak: true,
  hearts: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
  lastActivityAt: true,
  preferences: true,
  activeVestibularId: true,
} as const

// Descadastro do e-mail semanal pelo link do próprio e-mail (sem login).
usersRouter.post('/unsubscribe', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = z.object({ token: z.string().min(10).max(300) }).parse(req.body)
    const userId = verifyUnsubscribeToken(token)
    if (!userId) throw makeError('Link de descadastro inválido.', 400, 'INVALID_TOKEN')
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { preferences: true } })
    if (user) {
      await prisma.user.update({ where: { id: userId },
        data: { preferences: { ...preferencesWithDefaults(user.preferences), weeklyEmail: false } } })
    }
    res.json({ ok: true })
  } catch (err) { next(err) }
})

usersRouter.get('/me/plan', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try { res.json(await planSummary(req.userId!)) } catch (err) { next(err) }
})

usersRouter.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId! }, select: safeSelect })
    res.json({ ...user, preferences: preferencesWithDefaults(user.preferences) })
  } catch (err) {
    next(err)
  }
})

usersRouter.patch(
  '/me',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = UpdateMeSchema.parse(req.body)
      if (input.activeVestibularId !== undefined) {
        const enrollment = await prisma.enrollment.findUnique({
          where: { userId_vestibularId: { userId: req.userId!, vestibularId: input.activeVestibularId } },
        })
        if (!enrollment) throw makeError('Matricule-se neste vestibular antes de selecioná-lo', 403, 'NOT_ENROLLED')
      }
      const current = input.preferences !== undefined
        ? await prisma.user.findUniqueOrThrow({ where: { id: req.userId! }, select: { preferences: true } })
        : null
      const user = await prisma.user.update({
        where: { id: req.userId! },
        data: {
          ...input,
          ...(current ? { preferences: { ...preferencesWithDefaults(current.preferences), ...input.preferences } } : {}),
        },
        select: safeSelect,
      })
      res.json({ ...user, preferences: preferencesWithDefaults(user.preferences) })
    } catch (err) {
      next(err)
    }
  },
)
