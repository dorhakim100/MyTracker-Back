"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainerRequestController = void 0;
const trainer_request_service_1 = require("./trainer-request.service");
const logger_service_1 = require("../../services/logger.service");
class TrainerRequestController {
    static async getRequests(req, res) {
        try {
            const requests = await trainer_request_service_1.TrainerRequestService.query(req.query);
            res.json(requests);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get trainer requests', err);
            res.status(500).send({ err: 'Failed to get trainer requests' });
        }
    }
    static async getRequest(req, res) {
        try {
            const request = await trainer_request_service_1.TrainerRequestService.getById(req.params.id);
            if (!request) {
                return res.status(404).send({ err: 'Trainer request not found' });
            }
            res.json(request);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get trainer request', err);
            res.status(500).send({ err: 'Failed to get trainer request' });
        }
    }
    static async getByTrainer(req, res) {
        try {
            const trainerId = req.params.trainerId;
            const requests = await trainer_request_service_1.TrainerRequestService.getByTrainerId(trainerId);
            res.json(requests);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get trainer requests by trainer', err);
            res.status(500).send({ err: 'Failed to get trainer requests by trainer' });
        }
    }
    static async getByTrainee(req, res) {
        try {
            const traineeId = req.params.traineeId;
            const requests = await trainer_request_service_1.TrainerRequestService.getByTraineeId(traineeId);
            res.json(requests);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get trainer requests by trainee', err);
            res.status(500).send({ err: 'Failed to get trainer requests by trainee' });
        }
    }
    static async getPendingByTrainer(req, res) {
        try {
            const trainerId = req.params.trainerId;
            const requests = await trainer_request_service_1.TrainerRequestService.getPendingByTrainerId(trainerId);
            res.json(requests);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get pending trainer requests by trainer', err);
            res
                .status(500)
                .send({ err: 'Failed to get pending trainer requests by trainer' });
        }
    }
    static async getPendingByTrainee(req, res) {
        try {
            const traineeId = req.params.traineeId;
            const requests = await trainer_request_service_1.TrainerRequestService.getPendingByTraineeId(traineeId);
            res.json(requests);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get pending trainer requests by trainee', err);
            res
                .status(500)
                .send({ err: 'Failed to get pending trainer requests by trainee' });
        }
    }
    static async createRequest(req, res) {
        try {
            const requestData = req.body;
            const request = {
                trainerId: requestData.trainer,
                traineeId: requestData.trainee,
            };
            const newRequest = await trainer_request_service_1.TrainerRequestService.create(request);
            res.status(201).json(newRequest);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to create trainer request', err);
            const statusCode = err.message.includes('not found') ||
                err.message.includes('not a trainer') ||
                err.message.includes('yourself') ||
                err.message.includes('already exists')
                ? 400
                : 500;
            res
                .status(statusCode)
                .send({ err: err.message || 'Failed to create trainer request' });
        }
    }
    static async approveRequest(req, res) {
        try {
            const requestId = req.params.id;
            const approvedRequest = await trainer_request_service_1.TrainerRequestService.approve(requestId);
            res.json(approvedRequest);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to approve trainer request', err);
            const statusCode = err.message.includes('not found') ? 404 : 500;
            res
                .status(statusCode)
                .send({ err: err.message || 'Failed to approve trainer request' });
        }
    }
    static async rejectRequest(req, res) {
        try {
            const requestId = req.params.id;
            const rejectedRequest = await trainer_request_service_1.TrainerRequestService.reject(requestId);
            res.json(rejectedRequest);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to reject trainer request', err);
            const statusCode = err.message.includes('not found') ? 404 : 500;
            res
                .status(statusCode)
                .send({ err: err.message || 'Failed to reject trainer request' });
        }
    }
    static async deleteRequest(req, res) {
        try {
            const requestId = req.params.id;
            await trainer_request_service_1.TrainerRequestService.remove(requestId);
            res.send({ msg: 'Trainer request deleted successfully' });
        }
        catch (err) {
            logger_service_1.logger.error('Failed to delete trainer request', err);
            const statusCode = err.message.includes('not found') ? 404 : 500;
            res
                .status(statusCode)
                .send({ err: err.message || 'Failed to delete trainer request' });
        }
    }
}
exports.TrainerRequestController = TrainerRequestController;
