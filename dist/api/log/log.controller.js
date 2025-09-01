"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogController = void 0;
const log_service_1 = require("./log.service");
const logger_service_1 = require("../../services/logger.service");
class LogController {
    static async getLogs(req, res) {
        try {
            const logs = await log_service_1.LogService.query(req.query);
            res.json(logs);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get logs', err);
            res.status(500).send({ err: 'Failed to get logs' });
        }
    }
    static async getLog(req, res) {
        try {
            const log = await log_service_1.LogService.getById(req.params.id);
            res.json(log);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get log', err);
            res.status(500).send({ err: 'Failed to get log' });
        }
    }
    static async addLog(req, res) {
        try {
            const log = req.body;
            // log.createdBy = req.user?._id as string
            const addedLog = await log_service_1.LogService.add(log);
            res.json(addedLog);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to add log', err);
            res.status(500).send({ err: 'Failed to add log' });
        }
    }
    static async updateLog(req, res) {
        try {
            const log = await log_service_1.LogService.update(req.params.id, req.body);
            res.json(log);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to update log', err);
            res.status(500).send({ err: 'Failed to update log' });
        }
    }
    static async deleteLog(req, res) {
        try {
            await log_service_1.LogService.remove(req.params.id);
            res.send({ msg: 'Deleted successfully' });
        }
        catch (err) {
            logger_service_1.logger.error('Failed to delete log', err);
            res.status(500).send({ err: 'Failed to delete log' });
        }
    }
}
exports.LogController = LogController;
