import { Router } from 'express'
import { ExerciseController } from './exercise.controller'
import { requireAuth } from '../../middleware/auth.middleware'
import { requireUserAccess } from '../../middleware/user-access.middleware'

const router = Router()

const userIfSent = requireUserAccess(
  [{ from: 'query', name: 'userId' }],
  { when: 'ifPresent' }
)

router.get('/', ExerciseController.getExercises)
router.get('/alternate', ExerciseController.getAlternateExercises)
router.get('/search', userIfSent, ExerciseController.searchExercises)
router.get(
  '/search/muscle-groups',
  ExerciseController.searchExercisesByMuscleGroups
)
router.get('/search/equipment', ExerciseController.searchExercisesByEquipment)
router.get('/exercise-id/bulk', ExerciseController.getExercisesByExerciseIds)
router.get('/exercise-id', ExerciseController.getExerciseByExerciseId)
router.get('/:id', ExerciseController.getExercise)

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
