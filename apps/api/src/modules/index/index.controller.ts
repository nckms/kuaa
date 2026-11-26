import type { Request, Response, NextFunction } from 'express'
import { prisma } from '../../lib/prisma'
import { makeError } from '../../utils/errors'
import { getIndexData } from './index.service'
import { getTriIndex } from './triIndex'

export async function getIndex(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { vestibularSlug } = req.params as { vestibularSlug: string }
    const vestibular = await prisma.vestibular.findUnique({ where: { slug: vestibularSlug } })
    if (!vestibular) throw makeError('Vestibular não encontrado', 404, 'NOT_FOUND')

    // ENEM: o Índice acompanha a nota TRI (escala oficial do INEP). Outros vestibulares não têm TRI.
    const [data, tri] = await Promise.all([
      getIndexData(req.userId!, vestibular.id),
      vestibular.slug === 'enem' ? getTriIndex(req.userId!, vestibular.id) : Promise.resolve(null),
    ])
    res.json({ ...data, tri })
  } catch (err) {
    next(err)
  }
}
