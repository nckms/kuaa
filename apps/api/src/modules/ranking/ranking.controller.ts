import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../../lib/prisma'
import { makeError } from '../../utils/errors'
import { getRanking } from './ranking.service'

export async function getRankingHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { vestibularSlug } = req.params as { vestibularSlug: string }
    const vestibular = await prisma.vestibular.findUnique({ where: { slug: vestibularSlug } })
    if (!vestibular) throw makeError('Vestibular não encontrado', 404, 'NOT_FOUND')

    const data = await getRanking(vestibular.id, req.userId!)
    res.json(data)
  } catch (err) {
    next(err)
  }
}
