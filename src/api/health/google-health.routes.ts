import { Router } from 'express'
import { GoogleHealthController } from './google-health.controller'
import { requireUserAccess } from '../../middleware/user-access.middleware'

const router = Router()

const readOwnHealth = requireUserAccess([
  { from: 'query', name: 'userId', required: true },
])

const disconnectOwnHealth = requireUserAccess([
  { from: 'body', name: 'userId', required: true, allowTrainer: false },
])

router.get('/status', readOwnHealth, GoogleHealthController.getStatus)
router.get('/today', readOwnHealth, GoogleHealthController.getTodayActivitySummary)
router.get('/snapshot', readOwnHealth, GoogleHealthController.getSnapshot)
router.post('/disconnect', disconnectOwnHealth, GoogleHealthController.disconnect)

export const googleHealthRoutes = router
