import { Router } from 'express'
import { WorkoutController } from './workout.controller'
import { requireAuth } from '../../middleware/auth.middleware'

const router = Router()

router.get('/', WorkoutController.getWorkouts)
router.get('/:id', WorkoutController.getWorkout)
router.post('/', requireAuth, WorkoutController.addWorkout)
router.put('/:id', requireAuth, WorkoutController.updateWorkout)
router.delete('/:id', requireAuth, WorkoutController.deleteWorkout)

export const workoutRoutes = router
