import { Router } from 'express'
import { SessionController } from './session.controller'
import {
  requireDocAccess,
  requireUserAccess,
} from '../../middleware/user-access.middleware'
import { Session } from './session.model'

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
const ownSession = requireDocAccess(Session, 'userId')

router.get('/', queryUser, SessionController.get)
router.get('/workout/:workoutId', queryUser, SessionController.listByWorkoutWeek)
router.put('/play/empty', bodyUser, SessionController.playEmptyWorkout)
router.put('/play/:id', bodyUser, ownSession, SessionController.playWorkout)
router.post('/', bodyUser, SessionController.add)
router.get('/:id', ownSession, SessionController.getById)
router.put('/:id', ownSession, requireUserAccess([{ from: 'body', name: 'userId' }]), SessionController.update)
router.delete('/:id', ownSession, SessionController.delete)
router.get('/user/:userId', paramUser, SessionController.listByUser)
router.get('/by-date/:userId', paramUser, SessionController.getByDate)

export const sessionRoutes = router
