import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { requireAuth } from '../../middleware/requireAuth'
import { makeError } from '../../utils/errors'

export const usersRouter = Router()

const PreferencesSchema = z.object({
  dailyStudyMinutes: z.number().int().min(5).max(240).default(30),
  reducedMotion: z.boolean().default(false),
  highContrast: z.boolean().default(false),
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
