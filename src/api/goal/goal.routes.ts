import { Router } from 'express'
import { GoalController } from './goal.controller'
import {
  requireDocAccess,
  requireUserAccess,
} from '../../middleware/user-access.middleware'
import { GoalModel } from './goal.model'

const router = Router()

const paramUser = requireUserAccess([
  { from: 'params', name: 'userId', required: true },
])
const bodyUser = requireUserAccess([
  { from: 'body', name: 'userId', required: true },
])
const ownGoal = requireDocAccess(GoalModel, 'userId')
const selectedGoal = requireDocAccess(GoalModel, 'userId', { body: 'goalId' })

router.get('/user/:userId', paramUser, GoalController.listByUser)
router.get('/:id', ownGoal, GoalController.getById)
router.put('/select', bodyUser, selectedGoal, GoalController.select)
router.post('/', bodyUser, GoalController.add)
router.put('/:id', ownGoal, requireUserAccess([{ from: 'body', name: 'userId' }]), GoalController.update)
router.delete('/:id', ownGoal, GoalController.remove)

export const goalRoutes = router
