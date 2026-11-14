import { Router } from 'express'
import { TrainerRequestController } from './trainer-request.controller'
import {
  requireRequestParty,
  requireUserAccess,
} from '../../middleware/user-access.middleware'

const router = Router()

const listRequests = requireUserAccess(
  [
    { from: 'query', name: 'trainerId', allowTrainer: false },
    { from: 'query', name: 'traineeId' },
  ],
  { oneOf: true }
)
const ownTrainer = requireUserAccess([
  { from: 'params', name: 'trainerId', required: true, allowTrainer: false },
])
const ownTrainee = requireUserAccess([
  { from: 'params', name: 'traineeId', required: true },
])
const eitherParty = requireRequestParty(['trainerId', 'traineeId'])
const traineeOnly = requireRequestParty(['traineeId'])
const createAsTrainer = requireUserAccess([
  { from: 'body', name: 'trainer', required: true, allowTrainer: false },
])

router.get('/', listRequests, TrainerRequestController.getRequests)
router.get(
  '/trainer/:trainerId/pending',
  ownTrainer,
  TrainerRequestController.getPendingByTrainer
)
router.get(
  '/trainee/:traineeId/pending',
  ownTrainee,
  TrainerRequestController.getPendingByTrainee
)
router.get('/trainer/:trainerId', ownTrainer, TrainerRequestController.getByTrainer)
router.get('/trainee/:traineeId', ownTrainee, TrainerRequestController.getByTrainee)
router.get('/:id', eitherParty, TrainerRequestController.getRequest)
router.post('/', createAsTrainer, TrainerRequestController.createRequest)
router.put('/:id/approve', traineeOnly, TrainerRequestController.approveRequest)
router.put('/:id/reject', traineeOnly, TrainerRequestController.rejectRequest)
router.delete('/:id', eitherParty, TrainerRequestController.deleteRequest)

export const trainerRequestRoutes = router
