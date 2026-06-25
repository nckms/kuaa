import type { Request, Response, NextFunction } from 'express'
import { quizService } from './quiz.service'
import { GenerateSchema, AnswerSchema } from './quiz.schemas'

export async function generate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = GenerateSchema.parse(req.body)
    const result = await quizService.generate(req.userId!, input)
    res.status(201).json(result)
  } catch (err) { next(err) }
}

export async function getJobStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const jobId = req.params['jobId'] as string
    const rawSessionId = req.query['sessionId']
    const sessionId: string | undefined = Array.isArray(rawSessionId)
      ? (rawSessionId[0] as string)
      : (rawSessionId as string | undefined)
    if (!sessionId) { res.status(400).json({ error: 'sessionId obrigatório' }); return }
    const result = await quizService.getJobStatus(jobId, sessionId)
    res.json(result)
  } catch (err) { next(err) }
}

export async function getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = Array.isArray(req.params['sessionId']) ? req.params['sessionId'][0] : req.params['sessionId']
    const result = await quizService.getSession(req.userId!, sessionId)
    res.json(result)
  } catch (err) { next(err) }
}

export async function getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = Array.isArray(req.params['sessionId']) ? req.params['sessionId'][0] : req.params['sessionId']
    const result = await quizService.getSummary(req.userId!, sessionId)
    res.json(result)
  } catch (err) { next(err) }
}

export async function answer(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const input = AnswerSchema.parse(req.body)
    const sessionId = Array.isArray(req.params['sessionId']) ? req.params['sessionId'][0] : req.params['sessionId']
    const result = await quizService.answer(req.userId!, sessionId, input)
    res.json(result)
  } catch (err) { next(err) }
}

export async function finish(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = Array.isArray(req.params['sessionId']) ? req.params['sessionId'][0] : req.params['sessionId']
    const result = await quizService.finish(req.userId!, sessionId)
    res.json(result)
  } catch (err) { next(err) }
}
