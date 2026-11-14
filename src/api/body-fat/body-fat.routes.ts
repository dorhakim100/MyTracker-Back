import { Router } from 'express'
import { BodyFatController } from './body-fat.controller'
import { requireUserAccess } from '../../middleware/user-access.middleware'

const router = Router()

router.post(
  '/estimate',
  requireUserAccess([{ from: 'body', name: 'userId', required: true }]),
  BodyFatController.estimate
)

export const bodyFatRoutes = router
