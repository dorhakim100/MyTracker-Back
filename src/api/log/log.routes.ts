import { Router } from 'express'
import { LogController } from './log.controller'
import { protect } from '../../middleware/auth.middleware'

const router = Router()

router.get('/', LogController.getLogs)
router.get('/:id', LogController.getLog)
router.post('/', protect, LogController.addLog)
router.put('/:id', protect, LogController.updateLog)
router.delete('/:id', protect, LogController.deleteLog)

export const logRoutes = router
