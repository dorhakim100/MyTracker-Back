"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BodyFatService = void 0;
const body_fat_model_1 = require("./body-fat.model");
const body_fat_gemini_1 = require("./gemini/body-fat.gemini");
const logger_service_1 = require("../../services/logger.service");
class BodyFatService {
    static async estimate(userId, imageUrl, weightKg) {
        if (!userId) {
            throw new Error('userId is required');
        }
        if (!imageUrl) {
            throw new Error('imageUrl is required');
        }
        let geminiResult;
        try {
            geminiResult = await body_fat_gemini_1.BodyFatGeminiService.estimateFromImageUrl(imageUrl, weightKg);
        }
        catch (err) {
            logger_service_1.logger.error('BodyFatGeminiService.estimateFromImageUrl failed', err);
            throw new Error('Failed to analyze image');
        }
        try {
            const saved = await body_fat_model_1.BodyFatEstimate.create({
                userId,
                minPercent: geminiResult.minPercent,
                maxPercent: geminiResult.maxPercent,
                note: geminiResult.note,
                imageUrl,
                weightKg,
                createdAt: Date.now(),
            });
            return { ...BodyFatService.toResponse(saved), status: 'ok' };
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
            imageUrl: doc.imageUrl,
            createdAt: doc.createdAt,
        };
    }
}
exports.BodyFatService = BodyFatService;
