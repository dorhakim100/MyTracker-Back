import { Router } from 'express'
import { GoogleHealthController } from './google-health.controller'

const router = Router()

router.get('/status', GoogleHealthController.getStatus)
router.get('/today', GoogleHealthController.getTodayActivitySummary)
router.get('/snapshot', GoogleHealthController.getSnapshot)
router.post('/disconnect', GoogleHealthController.disconnect)

export const googleHealthRoutes = router
