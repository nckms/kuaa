import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { enrollmentsService } from './enrollments.service'

const EnrollSchema = z.object({ vestibularId: z.string().min(1) })

export async function getMyEnrollments(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const data = await enrollmentsService.getMyEnrollments(req.userId!)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export async function enroll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { vestibularId } = EnrollSchema.parse(req.body)
    const result = await enrollmentsService.enroll(req.userId!, vestibularId)
    res.status(201).json(result)
  } catch (err) {
    next(err)
  }
}

export async function unenroll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await enrollmentsService.unenroll(req.userId!, req.params.id as string)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}
