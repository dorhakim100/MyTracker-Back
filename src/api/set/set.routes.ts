import { Router } from 'express'
import { SetController } from './set.controller'
import { requireAuth } from '../../middleware/auth.middleware'

const router = Router()

router.get('/', SetController.getSets)
router.get('/session/:sessionId', SetController.getSetsBySessionId)
router.get(
  '/session/:sessionId/exercise/:exerciseId',
  SetController.getSetsBySessionIdAndExerciseId
)
router.get('/:id', SetController.getSet)

router.post('/', requireAuth, SetController.addSet)
router.post('/bulk-save', requireAuth, SetController.bulkSaveSets)
router.post(
  '/session/:sessionId/exercise/:exerciseId/:setIndex',
  SetController.addSetBySessionIdAndExerciseIdAndSetIndex
)
router.put(
  '/session/:sessionId/exercise/:exerciseId/:setIndex',
  SetController.saveSetBySessionIdAndExerciseIdAndSetIndex
)
router.delete(
  '/session/:sessionId/exercise/:exerciseId/:setIndex',
  SetController.deleteSetBySessionIdAndExerciseIdAndSetIndex
)

router.put('/:id', requireAuth, SetController.updateSet)
router.delete('/:id', requireAuth, SetController.deleteSet)
router.delete(
  '/session/:sessionId',
  requireAuth,
  SetController.deleteSetsBySessionId
)
router.delete(
  '/session/:sessionId/exercise/:exerciseId',
  requireAuth,
  SetController.deleteSetsBySessionIdAndExerciseId
)

export const setRoutes = router
