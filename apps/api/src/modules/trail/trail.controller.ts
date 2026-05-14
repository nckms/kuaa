import type { Request, Response, NextFunction } from 'express'
import { trailService } from './trail.service'

export async function getTrail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const trail = await trailService.getTrail(req.userId!, req.params.vestibularSlug as string)
    res.json(trail)
  } catch (err) {
    next(err)
  }
}

export async function getNextTopic(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await trailService.getNextTopic(req.userId!, req.params.vestibularSlug as string)
    res.json(result)
  } catch (err) {
    next(err)
  }
}
