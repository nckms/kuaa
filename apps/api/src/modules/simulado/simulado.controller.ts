import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../../lib/prisma'
import { makeError } from '../../utils/errors'
import {
  startOrGetSimulado,
  getCurrentAttempt,
  getAttempt,
  saveAnswer,
  toggleFlag,
  finishSimulado,
} from './simulado.service'

async function resolveVestibular(slug: string) {
  const v = await prisma.vestibular.findUnique({ where: { slug } })
  if (!v) throw makeError('Vestibular não encontrado', 404, 'NOT_FOUND')
  return v
}

export async function startHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { vestibularSlug } = req.params as { vestibularSlug: string }
    const v = await resolveVestibular(vestibularSlug)
    const data = await startOrGetSimulado(v.id, v.name, req.userId!)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export async function currentHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { vestibularSlug } = req.params as { vestibularSlug: string }
    const v = await resolveVestibular(vestibularSlug)
    const data = await getCurrentAttempt(v.id, req.userId!)
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export async function getAttemptHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { attemptId } = req.params as { attemptId: string }
    const data = await getAttempt(attemptId, req.userId!)
    if (!data) throw makeError('Tentativa não encontrada', 404, 'NOT_FOUND')
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export async function answerHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { attemptId } = req.params as { attemptId: string }
    const { questionId, optionId } = req.body as { questionId: string; optionId: string }
    if (!questionId || !optionId) throw makeError('questionId e optionId são obrigatórios', 400, 'BAD_REQUEST')
    const data = await saveAnswer(attemptId, req.userId!, questionId, optionId)
    if (!data) throw makeError('Tentativa não encontrada ou já finalizada', 404, 'NOT_FOUND')
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export async function flagHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { attemptId } = req.params as { attemptId: string }
    const { questionId } = req.body as { questionId: string }
    if (!questionId) throw makeError('questionId é obrigatório', 400, 'BAD_REQUEST')
    const data = await toggleFlag(attemptId, req.userId!, questionId)
    if (!data) throw makeError('Tentativa não encontrada ou já finalizada', 404, 'NOT_FOUND')
    res.json(data)
  } catch (err) {
    next(err)
  }
}

export async function finishHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { attemptId } = req.params as { attemptId: string }
    const data = await finishSimulado(attemptId, req.userId!)
    if (!data) throw makeError('Tentativa não encontrada ou já finalizada', 404, 'NOT_FOUND')
    res.json(data)
  } catch (err) {
    next(err)
  }
}
