"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslateController = void 0;
const logger_service_1 = require("../../services/logger.service");
const translate_service_1 = require("./translate.service");
class TranslateController {
    static async translate(req, res) {
        try {
            const text = req.query.q;
            const target = req.query.target;
            if (!text) {
                return;
            }
            const translated = await translate_service_1.TranslateService.translate(text, target);
            res.json(translated);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to translate', err);
            res.status(500).send({ err: 'Failed to translate' });
        }
    }
}
exports.TranslateController = TranslateController;
