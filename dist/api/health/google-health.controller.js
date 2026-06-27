"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleHealthController = void 0;
const google_health_service_1 = require("./google-health.service");
const logger_service_1 = require("../../services/logger.service");
class GoogleHealthController {
    static async getStatus(req, res) {
        try {
            const userId = req.user?._id;
            if (!userId) {
                return res.status(401).send({ err: 'Not authenticated' });
            }
            const status = await google_health_service_1.GoogleHealthService.getStatus(userId);
            res.json(status);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get Google Health status', err);
            res.status(500).send({ err: 'Failed to get Google Health status' });
        }
    }
    static async getTodayActivitySummary(req, res) {
        try {
            const userId = req.user?._id;
            if (!userId) {
                return res.status(401).send({ err: 'Not authenticated' });
            }
            const summary = await google_health_service_1.GoogleHealthService.getTodayActivitySummary(userId);
            res.json(summary);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get Google Health activity summary', err);
            res.status(500).send({ err: 'Failed to get Google Health activity summary' });
        }
    }
}
exports.GoogleHealthController = GoogleHealthController;
