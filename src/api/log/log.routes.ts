import { Router } from 'express'
import { LogController } from './log.controller'
import { protect, requireAuth } from '../../middleware/auth.middleware'

const router = Router()

router.get('/', LogController.getLogs)
router.get('/:id', LogController.getLog)
router.post('/', requireAuth, LogController.addLog)
router.put('/:id', requireAuth, LogController.updateLog)
router.delete('/:id', requireAuth, LogController.deleteLog)

export const logRoutes = router
