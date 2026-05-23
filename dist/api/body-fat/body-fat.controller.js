"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BodyFatController = void 0;
const body_fat_service_1 = require("./body-fat.service");
const logger_service_1 = require("../../services/logger.service");
class BodyFatController {
    static async estimate(req, res) {
        try {
            const { userId, img } = req.body;
            if (!userId || !img) {
                return res.status(400).send({ err: 'userId and img are required' });
            }
            const result = await body_fat_service_1.BodyFatService.estimate(userId, img);
            res.json(result);
        }
        catch (err) {
            const statusCode = err.statusCode || 500;
            if (statusCode >= 500) {
                logger_service_1.logger.error('BodyFatController.estimate failed', err);
            }
            res.status(statusCode).send({
                err: err.message || 'Failed to estimate body fat',
            });
        }
    }
}
exports.BodyFatController = BodyFatController;
