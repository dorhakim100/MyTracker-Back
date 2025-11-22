import { Router } from 'express'
import { SetController } from './set.controller'
import { requireAuth } from '../../middleware/auth.middleware'

const router = Router()

router.get('/', SetController.getSets)
router.get('/workout/:workoutId', SetController.getSetsByWorkoutId)
router.get('/exercise/:exerciseId', SetController.getSetsByExerciseId)
router.get('/:id', SetController.getSet)
router.post('/', requireAuth, SetController.addSet)
router.put('/:id', requireAuth, SetController.updateSet)
router.delete('/:id', requireAuth, SetController.deleteSet)

export const setRoutes = router

