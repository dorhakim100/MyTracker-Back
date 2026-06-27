import { Router } from 'express'
import { GoogleHealthController } from './google-health.controller'

const router = Router()

router.get('/status', GoogleHealthController.getStatus)
router.get('/today', GoogleHealthController.getTodayActivitySummary)

export const googleHealthRoutes = router
