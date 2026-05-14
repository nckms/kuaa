import { Router } from 'express'
import { requireAuth } from '../../middleware/requireAuth'
import * as enrollmentsController from './enrollments.controller'

export const enrollmentsRouter = Router()

enrollmentsRouter.get('/me', requireAuth, enrollmentsController.getMyEnrollments)
enrollmentsRouter.post('/', requireAuth, enrollmentsController.enroll)
enrollmentsRouter.delete('/:id', requireAuth, enrollmentsController.unenroll)
