import { Router } from 'express'
import { SetController } from './set.controller'
import {
  requireDocAccess,
  requireListAccess,
  requireUserAccess,
} from '../../middleware/user-access.middleware'
import { Set as SetModel } from './set.model'
import { Session } from '../session/session.model'

const router = Router()

const queryUser = requireUserAccess([
  { from: 'query', name: 'userId', required: true },
])
const bodyUser = requireUserAccess([
  { from: 'body', name: 'userId', required: true },
])
const bodyUserIfSent = requireUserAccess([{ from: 'body', name: 'userId' }])
const ownSet = requireDocAccess(SetModel, 'userId')
const ownSession = requireDocAccess(Session, 'userId', { param: 'sessionId' })
const sessionOnBody = requireDocAccess(Session, 'userId', { body: 'sessionId' })
const saveMany = requireListAccess({
  userField: 'userId',
  sessionField: 'sessionId',
  sessionModel: Session,
})

router.get('/', queryUser, SetController.getSets)
router.get('/session/:sessionId', ownSession, SetController.getSetsBySessionId)
router.get(
  '/session/:sessionId/exercise/:exerciseId',
  ownSession,
  SetController.getSetsBySessionIdAndExerciseId
)
router.get('/:id', ownSet, SetController.getSet)

router.post('/', bodyUser, sessionOnBody, SetController.addSet)
router.post('/bulk-save', saveMany, SetController.bulkSaveSets)
router.post(
  '/session/:sessionId/exercise/:exerciseId/:setIndex',
  ownSession,
  bodyUserIfSent,
  SetController.addSetBySessionIdAndExerciseIdAndSetIndex
)
router.put(
  '/session/:sessionId/exercise/:exerciseId/:setIndex',
  ownSession,
  bodyUserIfSent,
  SetController.saveSetBySessionIdAndExerciseIdAndSetIndex
)
router.delete(
  '/session/:sessionId/exercise/:exerciseId/:setIndex',
  ownSession,
  SetController.deleteSetBySessionIdAndExerciseIdAndSetIndex
)

router.put('/:id', ownSet, bodyUserIfSent, SetController.updateSet)
router.delete('/:id', ownSet, SetController.deleteSet)
router.delete('/session/:sessionId', ownSession, SetController.deleteSetsBySessionId)
router.delete(
  '/session/:sessionId/exercise/:exerciseId',
  ownSession,
  SetController.deleteSetsBySessionIdAndExerciseId
)

export const setRoutes = router
