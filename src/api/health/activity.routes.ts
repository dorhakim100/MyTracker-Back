import { Router } from 'express'
import { ActivityController } from './activity.controller'
import { requireUserAccess } from '../../middleware/user-access.middleware'

const router = Router()

const readOwnActivity = requireUserAccess([
  { from: 'query', name: 'userId', required: true },
])

const writeOwnActivity = requireUserAccess([
  { from: 'body', name: 'userId', required: true, allowTrainer: false },
])

router.get('/', readOwnActivity, ActivityController.getPage)
router.post('/days', writeOwnActivity, ActivityController.saveDays)
router.post('/google', writeOwnActivity, ActivityController.saveGoogle)
router.post('/backfill', writeOwnActivity, ActivityController.backfill)

export const activityRoutes = router
