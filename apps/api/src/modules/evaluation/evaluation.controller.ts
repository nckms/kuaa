import type { Request, Response, NextFunction } from 'express'
import { evaluationSchema } from './evaluation.schemas'
import { evaluationService } from './evaluation.service'

export async function getMine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    res.json(await evaluationService.getMine(req.userId!))
  } catch (error) { next(error) }
}

export async function saveMine(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = evaluationSchema.parse(req.body)
    res.json(await evaluationService.saveMine(req.userId!, input))
  } catch (error) { next(error) }
}
