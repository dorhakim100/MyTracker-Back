import { Router } from 'express'
import { ExerciseController } from './exercise.controller'
import { requireAuth } from '../../middleware/auth.middleware'

const router = Router()

// Exercise CRUD routes
router.get('/', ExerciseController.getExercises)
router.get('/alternate', ExerciseController.getAlternateExercises)
router.get('/search', ExerciseController.searchExercises)
router.get(
  '/search/muscle-groups',
  ExerciseController.searchExercisesByMuscleGroups
)
router.get('/search/equipment', ExerciseController.searchExercisesByEquipment)
router.get('/exercise-id/bulk', ExerciseController.getExercisesByExerciseIds)
router.get('/exercise-id', ExerciseController.getExerciseByExerciseId)
router.get('/:id', ExerciseController.getExercise)

// Protected routes (require authentication)
router.post('/', requireAuth, ExerciseController.addExercise)
router.post('/bulk', requireAuth, ExerciseController.addExercises)
router.put(
  '/exercise-id',
  requireAuth,
  ExerciseController.updateExerciseByExerciseId
)
router.put('/:id', requireAuth, ExerciseController.updateExercise)
router.delete(
  '/exercise-id',
  requireAuth,
  ExerciseController.deleteExerciseByExerciseId
)
router.delete('/:id', requireAuth, ExerciseController.deleteExercise)

export const exerciseRoutes = router
