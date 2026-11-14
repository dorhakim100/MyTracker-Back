import { Router } from 'express'
import { InstructionsController } from './instructions.controller'
import {
  requireDocAccess,
  requireRelatedAccess,
  requireUserAccess,
} from '../../middleware/user-access.middleware'
import { Instructions } from './instructions.model'
import { Workout } from '../workout/workout.model'
import { Session } from '../session/session.model'

const router = Router()

const ownWorkoutQuery = requireDocAccess(Workout, 'forUserId', {
  query: 'workoutId',
})
const ownWorkoutParam = requireDocAccess(Workout, 'forUserId', {
  param: 'workoutId',
})
const ownWorkoutBody = requireDocAccess(Workout, 'forUserId', {
  body: 'workoutId',
})
const ownInstruction = requireRelatedAccess(
  Instructions,
  'workoutId',
  Workout,
  'forUserId'
)
const ownSessionNotes = requireDocAccess(Session, 'userId', {
  query: 'sessionId',
})
const forUserIfSent = requireUserAccess([{ from: 'query', name: 'forUserId' }])

router.get('/', ownWorkoutQuery, forUserIfSent, InstructionsController.getInstructions)
router.get('/weekNumberDone', ownWorkoutQuery, InstructionsController.getWeekNumberDone)
router.get(
  '/workout/:workoutId',
  ownWorkoutParam,
  forUserIfSent,
  InstructionsController.getInstructionsByWorkoutId
)
router.get('/notes', ownSessionNotes, InstructionsController.getNotesBySessionIdAndExerciseId)
router.get('/:id', ownInstruction, InstructionsController.getInstruction)
router.post('/', ownWorkoutBody, InstructionsController.addInstruction)
router.put('/:id', ownInstruction, InstructionsController.updateInstruction)
router.delete('/:id', ownInstruction, InstructionsController.deleteInstruction)

export const instructionsRoutes = router
