import type { Request, Response, NextFunction } from 'express'
import { vestibularesService } from './vestibulares.service'

export async function listAll(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const vestibulares = await vestibularesService.listAll()
    res.json(vestibulares)
  } catch (err) {
    next(err)
  }
}

export async function getBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const detail = await vestibularesService.getDetail(req.params.slug as string)
    res.json(detail)
  } catch (err) {
    next(err)
  }
}
