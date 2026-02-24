"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeightController = void 0;
const weight_service_1 = require("./weight.service");
const logger_service_1 = require("../../services/logger.service");
class WeightController {
    static async getWeightsByUser(req, res) {
        try {
            const { userId, fromDate, toDate } = req.query;
            if (userId) {
                const weights = await weight_service_1.WeightService.listByUser(userId, fromDate, toDate);
                return res.json(weights);
            }
            const weights = await weight_service_1.WeightService.query(req.query);
            return res.json(weights);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get weights', err);
            res.status(500).send({ err: 'Failed to get weights' });
        }
    }
    static async getWeightById(req, res) {
        try {
            const weight = await weight_service_1.WeightService.getById(req.params.id);
            if (!weight)
                return res.status(404).send({ err: 'Weight not found' });
            res.json(weight);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get weight', err);
            res.status(500).send({ err: 'Failed to get weight' });
        }
    }
    static async add(req, res) {
        try {
            const added = await weight_service_1.WeightService.add(req.body);
            res.json(added);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to add weight', err);
            res.status(500).send({ err: 'Failed to add weight' });
        }
    }
    static async update(req, res) {
        try {
            const updated = await weight_service_1.WeightService.update(req.params.id, req.body);
            res.json(updated);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to update weight', err);
            res.status(500).send({ err: 'Failed to update weight' });
        }
    }
    static async remove(req, res) {
        try {
            await weight_service_1.WeightService.remove(req.params.id);
            res.send({ msg: 'Deleted successfully' });
        }
        catch (err) {
            logger_service_1.logger.error('Failed to delete weight', err);
            res.status(500).send({ err: 'Failed to delete weight' });
        }
    }
}
exports.WeightController = WeightController;
