import { Router } from 'express'
import * as vestibularesController from './vestibulares.controller'

export const vestibularesRouter = Router()

vestibularesRouter.get('/', vestibularesController.listAll)
vestibularesRouter.get('/:slug', vestibularesController.getBySlug)
