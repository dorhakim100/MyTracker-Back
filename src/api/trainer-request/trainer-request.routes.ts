import { Router } from 'express'
import { TrainerRequestController } from './trainer-request.controller'
import { requireAuth } from '../../middleware/auth.middleware'

const router = Router()

// Query all requests (with optional filters)
router.get('/', requireAuth, TrainerRequestController.getRequests)

// Get pending requests by trainer
router.get(
  '/trainer/:trainerId/pending',
  requireAuth,
  TrainerRequestController.getPendingByTrainer
)

// Get pending requests by trainee
router.get(
  '/trainee/:traineeId/pending',
  requireAuth,
  TrainerRequestController.getPendingByTrainee
)

// Get all requests by trainer
router.get(
  '/trainer/:trainerId',
  requireAuth,
  TrainerRequestController.getByTrainer
)

// Get all requests by trainee
router.get(
  '/trainee/:traineeId',
  requireAuth,
  TrainerRequestController.getByTrainee
)

// Get specific request
router.get('/:id', requireAuth, TrainerRequestController.getRequest)

// Create new request
router.post('/', requireAuth, TrainerRequestController.createRequest)

// Approve request
router.put('/:id/approve', requireAuth, TrainerRequestController.approveRequest)

// Reject request
router.put('/:id/reject', requireAuth, TrainerRequestController.rejectRequest)

// Delete request
router.delete('/:id', requireAuth, TrainerRequestController.deleteRequest)

export const trainerRequestRoutes = router
