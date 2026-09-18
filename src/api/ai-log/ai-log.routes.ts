import { Router } from 'express'
import { protect } from '../../middleware/auth.middleware'
import { AiLogController } from './ai-log.controller'

const router = Router()

router.post('/estimate', protect, AiLogController.estimate)

export const aiLogRoutes = router
