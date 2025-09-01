"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogService = void 0;
const log_model_1 = require("./log.model");
const logger_service_1 = require("../../services/logger.service");
class LogService {
    static async query(filterBy = {}) {
        try {
            const logs = await log_model_1.Log.find(filterBy).populate('createdBy', 'name email');
            return logs;
        }
        catch (err) {
            logger_service_1.logger.error('Failed to query logs', err);
            throw err;
        }
    }
    static async getById(logId) {
        try {
            const log = await log_model_1.Log.findById(logId).populate('createdBy', 'name email');
            return log;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to get log ${logId}`, err);
            throw err;
        }
    }
    static async add(log) {
        try {
            const addedLog = await log_model_1.Log.create(log);
            return addedLog;
        }
        catch (err) {
            logger_service_1.logger.error('Failed to add log', err);
            throw err;
        }
    }
    static async update(logId, logToUpdate) {
        try {
            const log = await log_model_1.Log.findByIdAndUpdate(logId, logToUpdate, {
                new: true,
            });
            return log;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to update log ${logId}`, err);
            throw err;
        }
    }
    static async remove(logId) {
        try {
            await log_model_1.Log.findByIdAndDelete(logId);
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to remove log ${logId}`, err);
            throw err;
        }
    }
}
exports.LogService = LogService;
