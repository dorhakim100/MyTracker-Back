import { Router } from 'express'
import { DayController } from './day.controller'
import {
  requireDocAccess,
  requireUserAccess,
} from '../../middleware/user-access.middleware'
import { Day } from './day.model'

const router = Router()

const queryUser = requireUserAccess([
  { from: 'query', name: 'userId', required: true },
])
const bodyUser = requireUserAccess([
  { from: 'body', name: 'userId', required: true },
])
const paramUser = requireUserAccess([
  { from: 'params', name: 'userId', required: true },
])
const ownDay = requireDocAccess(Day, 'userId')

router.get('/', queryUser, DayController.get)
router.post('/', bodyUser, DayController.upsert)
router.get('/:id', ownDay, DayController.getById)
router.put('/:id', ownDay, requireUserAccess([{ from: 'body', name: 'userId' }]), DayController.update)
router.get('/user/:userId', paramUser, DayController.listByUser)
router.get('/by-date/:userId', paramUser, DayController.getByDate)

export const dayRoutes = router
