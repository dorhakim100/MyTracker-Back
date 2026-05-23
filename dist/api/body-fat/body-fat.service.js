"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BodyFatService = void 0;
const body_fat_model_1 = require("./body-fat.model");
const body_fat_gemini_1 = require("./gemini/body-fat.gemini");
const body_fat_validation_1 = require("./body-fat.validation");
const logger_service_1 = require("../../services/logger.service");
class BodyFatService {
    static async estimate(userId, img) {
        if (!userId) {
            throw Object.assign(new Error('userId is required'), { statusCode: 400 });
        }
        if (!img) {
            throw Object.assign(new Error('img is required'), { statusCode: 400 });
        }
        if (!(0, body_fat_validation_1.isValidCloudinaryUrl)(img)) {
            throw Object.assign(new Error('img must be a valid Cloudinary HTTPS URL'), { statusCode: 400 });
        }
        let geminiResult;
        try {
            geminiResult = await body_fat_gemini_1.BodyFatGeminiService.estimateFromImageUrl(img);
        }
        catch (err) {
            logger_service_1.logger.error('BodyFatGeminiService.estimateFromImageUrl failed', err);
            throw Object.assign(new Error('Failed to analyze image'), {
                statusCode: 503,
            });
        }
        try {
            const saved = await body_fat_model_1.BodyFatEstimate.create({
                userId,
                minPercent: geminiResult.minPercent,
                maxPercent: geminiResult.maxPercent,
                note: geminiResult.note,
                img,
                createdAt: Date.now(),
            });
            return BodyFatService.toResponse(saved);
        }
        catch (err) {
            logger_service_1.logger.error('BodyFatService.estimate persist failed', err);
            throw err;
        }
    }
    static toResponse(doc) {
        return {
            _id: doc._id,
            userId: doc.userId,
            minPercent: doc.minPercent,
            maxPercent: doc.maxPercent,
            note: doc.note,
            img: doc.img,
            createdAt: doc.createdAt,
        };
    }
}
exports.BodyFatService = BodyFatService;
