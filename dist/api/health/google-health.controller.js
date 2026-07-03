"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleHealthController = void 0;
const google_health_service_1 = require("./google-health.service");
const google_health_snapshot_service_1 = require("./google-health-snapshot.service");
const logger_service_1 = require("../../services/logger.service");
class GoogleHealthController {
    static async getStatus(req, res) {
        try {
            const userId = req.query.userId;
            if (!userId) {
                return;
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
            const userId = req.query.userId;
            if (!userId) {
                return;
            }
            const summary = await google_health_service_1.GoogleHealthService.getTodayActivitySummary(userId);
            return res.json(summary);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get Google Health activity summary', err);
            return res
                .status(500)
                .send({ err: 'Failed to get Google Health activity summary' });
        }
    }
    static async getSnapshot(req, res) {
        try {
            const userId = req.query.userId;
            if (!userId) {
                return;
            }
            const snapshot = await google_health_snapshot_service_1.GoogleHealthSnapshotService.getSnapshotForUser(userId);
            return res.json(snapshot);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get Google Health snapshot', err);
            return res.status(500).send({ err: 'Failed to get Google Health snapshot' });
        }
    }
}
exports.GoogleHealthController = GoogleHealthController;
