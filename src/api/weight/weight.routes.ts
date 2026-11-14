import { Router } from 'express'
import { WeightController } from './weight.controller'
import {
  requireDocAccess,
  requireUserAccess,
} from '../../middleware/user-access.middleware'
import { Weight } from './weight.model'

const router = Router()

const queryUser = requireUserAccess([
  { from: 'query', name: 'userId', required: true },
])
const bodyUser = requireUserAccess([
  { from: 'body', name: 'userId', required: true },
])
const ownWeight = requireDocAccess(Weight, 'userId')

router.get('/', queryUser, WeightController.getWeightsByUser)
router.get('/:id', ownWeight, WeightController.getWeightById)
router.post('/', bodyUser, WeightController.add)
router.put('/:id', ownWeight, requireUserAccess([{ from: 'body', name: 'userId' }]), WeightController.update)
router.delete('/:id', ownWeight, WeightController.remove)

export const weightRoutes = router
