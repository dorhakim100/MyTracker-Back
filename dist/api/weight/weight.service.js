"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeightService = void 0;
const weight_model_1 = require("./weight.model");
const logger_service_1 = require("../../services/logger.service");
class WeightService {
    static async query(filterBy = {}) {
        try {
            const weights = await weight_model_1.Weight.find(filterBy).sort({ createdAt: -1 });
            return weights;
        }
        catch (err) {
            logger_service_1.logger.error('WeightService.query failed', err);
            throw err;
        }
    }
    static async listByUser(userId, fromDate, toDate) {
        try {
            const fromDateMs = fromDate ? new Date(fromDate).getTime() : 0;
            const toDateMs = toDate ? new Date(toDate).getTime() : Date.now();
            const weights = await weight_model_1.Weight.find({
                userId,
                createdAt: { $gte: fromDateMs, $lte: toDateMs },
            }).sort({ createdAt: -1 });
            return weights;
        }
        catch (err) {
            logger_service_1.logger.error(`WeightService.listByUser failed for ${userId}`, err);
            throw err;
        }
    }
    static async getById(id) {
        try {
            const weight = await weight_model_1.Weight.findById(id);
            return weight;
        }
        catch (err) {
            logger_service_1.logger.error(`WeightService.getById failed for ${id}`, err);
            throw err;
        }
    }
    static async add(weight) {
        try {
            const added = await weight_model_1.Weight.create(weight);
            return added;
        }
        catch (err) {
            logger_service_1.logger.error('WeightService.add failed', err);
            throw err;
        }
    }
    static async update(id, weightToUpdate) {
        try {
            const updated = await weight_model_1.Weight.findByIdAndUpdate(id, weightToUpdate, {
                new: true,
            });
            return updated;
        }
        catch (err) {
            logger_service_1.logger.error(`WeightService.update failed for ${id}`, err);
            throw err;
        }
    }
    static async remove(id) {
        try {
            await weight_model_1.Weight.findByIdAndDelete(id);
        }
        catch (err) {
            logger_service_1.logger.error(`WeightService.remove failed for ${id}`, err);
            throw err;
        }
    }
    static async removeAllByUserId(userId) {
        try {
            await weight_model_1.Weight.deleteMany({ userId });
        }
        catch (err) {
            logger_service_1.logger.error(`WeightService.removeAllByUserId failed for ${userId}`, err);
            throw err;
        }
    }
}
exports.WeightService = WeightService;
