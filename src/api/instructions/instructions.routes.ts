import { Router } from 'express'
import { InstructionsController } from './instructions.controller'
import { requireAuth } from '../../middleware/auth.middleware'

const router = Router()

router.get('/', InstructionsController.getInstructions)
router.get('/weekNumberDone', InstructionsController.getWeekNumberDone)
router.get(
  '/workout/:workoutId',
  InstructionsController.getInstructionsByWorkoutId
)
router.get('/actual-notes', InstructionsController.getActualNotes)
router.get('/:id', InstructionsController.getInstruction)
router.post('/', requireAuth, InstructionsController.addInstruction)
router.put('/:id', requireAuth, InstructionsController.updateInstruction)
router.delete('/:id', requireAuth, InstructionsController.deleteInstruction)

export const instructionsRoutes = router
