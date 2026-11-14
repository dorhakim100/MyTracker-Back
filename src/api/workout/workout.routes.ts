import { Router } from 'express'
import { WorkoutController } from './workout.controller'
import {
  requireDocAccess,
  requireUserAccess,
} from '../../middleware/user-access.middleware'
import { Workout } from './workout.model'

const router = Router()

const queryUser = requireUserAccess([
  { from: 'query', name: 'forUserId', required: true },
])
const bodyUser = requireUserAccess([
  { from: 'body', name: 'forUserId', required: true },
])
const ownWorkout = requireDocAccess(Workout, 'forUserId')

router.get('/', queryUser, WorkoutController.getWorkouts)
router.get('/:id', ownWorkout, WorkoutController.getWorkout)
router.post('/', bodyUser, WorkoutController.addWorkout)
router.put(
  '/:id',
  ownWorkout,
  requireUserAccess([{ from: 'body', name: 'forUserId' }]),
  WorkoutController.updateWorkout
)
router.delete('/:id', ownWorkout, WorkoutController.deleteWorkout)

export const workoutRoutes = router
