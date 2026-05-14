import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../../lib/prisma'
import { requireAuth } from '../../middleware/requireAuth'

export const usersRouter = Router()

const UpdateMeSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  school: z.string().optional(),
  city: z.string().optional(),
  state: z.string().length(2).optional(),
  avatarUrl: z.string().url().optional(),
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
} as const

usersRouter.get('/me', requireAuth, (req: Request, res: Response): void => {
  res.json(req.user)
})

usersRouter.patch(
  '/me',
  requireAuth,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const input = UpdateMeSchema.parse(req.body)
      const user = await prisma.user.update({
        where: { id: req.userId! },
        data: input,
        select: safeSelect,
      })
      res.json(user)
    } catch (err) {
      next(err)
    }
  },
)
