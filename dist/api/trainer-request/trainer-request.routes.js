"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trainerRequestRoutes = void 0;
const express_1 = require("express");
const trainer_request_controller_1 = require("./trainer-request.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Query all requests (with optional filters)
router.get('/', auth_middleware_1.requireAuth, trainer_request_controller_1.TrainerRequestController.getRequests);
// Get pending requests by trainer
router.get('/trainer/:trainerId/pending', auth_middleware_1.requireAuth, trainer_request_controller_1.TrainerRequestController.getPendingByTrainer);
// Get pending requests by trainee
router.get('/trainee/:traineeId/pending', auth_middleware_1.requireAuth, trainer_request_controller_1.TrainerRequestController.getPendingByTrainee);
// Get all requests by trainer
router.get('/trainer/:trainerId', auth_middleware_1.requireAuth, trainer_request_controller_1.TrainerRequestController.getByTrainer);
// Get all requests by trainee
router.get('/trainee/:traineeId', auth_middleware_1.requireAuth, trainer_request_controller_1.TrainerRequestController.getByTrainee);
// Get specific request
router.get('/:id', auth_middleware_1.requireAuth, trainer_request_controller_1.TrainerRequestController.getRequest);
// Create new request
router.post('/', auth_middleware_1.requireAuth, trainer_request_controller_1.TrainerRequestController.createRequest);
// Approve request
router.put('/:id/approve', auth_middleware_1.requireAuth, trainer_request_controller_1.TrainerRequestController.approveRequest);
// Reject request
router.put('/:id/reject', auth_middleware_1.requireAuth, trainer_request_controller_1.TrainerRequestController.rejectRequest);
// Delete request
router.delete('/:id', auth_middleware_1.requireAuth, trainer_request_controller_1.TrainerRequestController.deleteRequest);
exports.trainerRequestRoutes = router;
