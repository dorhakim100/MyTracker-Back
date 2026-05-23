import { Router } from 'express'
import { BodyFatController } from './body-fat.controller'
import { requireAuth } from '../../middleware/auth.middleware'

const router = Router()

router.post('/estimate', requireAuth, BodyFatController.estimate)

export const bodyFatRoutes = router
