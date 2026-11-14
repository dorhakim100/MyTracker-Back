import { Router } from 'express'
import { MessageController } from './message.controller'
import {
  requireDocAccess,
  requireLogin,
  requireRelatedAccess,
  requireUserAccess,
} from '../../middleware/user-access.middleware'
import { Message } from './message.model'
import { Workout } from '../workout/workout.model'

const router = Router()

const ownWorkoutQuery = requireDocAccess(Workout, 'forUserId', {
  query: 'workoutId',
})
const ownWorkoutBody = requireDocAccess(Workout, 'forUserId', {
  body: 'workoutId',
})
const ownMessage = requireRelatedAccess(Message, 'workoutId', Workout, 'forUserId')
const workoutIfSent = requireUserAccess([{ from: 'body', name: 'workoutId' }])

router.get('/', ownWorkoutQuery, MessageController.list)
router.get('/unread', requireLogin, MessageController.unread)
router.post('/', ownWorkoutBody, MessageController.add)
router.put('/read', ownWorkoutBody, MessageController.markRead)
router.put('/:id', ownMessage, workoutIfSent, MessageController.update)
router.delete('/:id', ownMessage, MessageController.remove)

export const messageRoutes = router
