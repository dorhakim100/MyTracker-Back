import { Router } from 'express'
import { StatsController } from './stats.controller'
import { requireDocAccess, requireUserAccess } from '../../middleware/user-access.middleware'
import { Session } from '../session/session.model'

const router = Router()

const ownSession = requireDocAccess(Session, 'userId', { param: 'sessionId' })
const ownWeekUser = requireUserAccess([
  { from: 'query', name: 'forUserId', required: true },
])

router.post('/session/:sessionId/frame/open', ownSession, StatsController.openFrame)
router.post('/session/:sessionId/finish', ownSession, StatsController.finish)
router.get('/session/:sessionId', ownSession, StatsController.getRecap)
router.get('/week', ownWeekUser, StatsController.getWeek)
router.get('/distribution', ownWeekUser, StatsController.getDistribution)

export const statsRoutes = router
