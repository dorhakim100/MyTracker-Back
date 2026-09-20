import { Router } from 'express'
import { protect } from '../../middleware/auth.middleware'
import { StatsController } from './stats.controller'

const router = Router()

router.post(
  '/session/:sessionId/frame/open',
  protect,
  StatsController.openFrame
)
router.post('/session/:sessionId/finish', protect, StatsController.finish)
router.get('/session/:sessionId', protect, StatsController.getRecap)

export const statsRoutes = router
