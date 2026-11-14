import { Router } from 'express'
import { LogController } from './log.controller'
import {
  requireDocAccess,
  requireUserAccess,
} from '../../middleware/user-access.middleware'
import { Log } from './log.model'

const router = Router()

const listLogs = requireUserAccess(
  [
    { from: 'query', name: 'createdBy' },
    { from: 'query', name: 'userId' },
  ],
  { oneOf: true }
)
const ownLog = requireDocAccess(Log, 'createdBy')
const logOwner = requireUserAccess([{ from: 'body', name: 'createdBy', required: true }])
const clearMealUser = requireUserAccess(
  [
    { from: 'body', name: 'userId' },
    { from: 'query', name: 'userId' },
  ],
  { oneOf: true }
)

router.get('/', listLogs, LogController.getLogs)
router.delete('/meal', clearMealUser, LogController.clearMeal)
router.get('/:id', ownLog, LogController.getLog)
router.post('/', logOwner, LogController.addLog)
router.put('/:id', ownLog, requireUserAccess([{ from: 'body', name: 'createdBy' }]), LogController.updateLog)
router.delete('/:id', ownLog, LogController.deleteLog)

export const logRoutes = router
