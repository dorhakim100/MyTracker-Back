"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BodyFatCleanupService = void 0;
const body_fat_model_1 = require("./body-fat.model");
const cloudinary_service_1 = require("../../services/cloudinary/cloudinary.service");
const logger_service_1 = require("../../services/logger.service");
class BodyFatCleanupService {
    static async purgeAll() {
        const estimates = await body_fat_model_1.BodyFatEstimate.find({}, { imageUrl: 1 }).lean();
        const imageUrls = [
            ...new Set(estimates
                .map((doc) => doc.imageUrl)
                .filter((url) => typeof url === 'string' && url.length > 0)),
        ];
        logger_service_1.logger.info(`BodyFatCleanupService: starting purge (${estimates.length} estimates, ${imageUrls.length} unique image URLs)`);
        const cloudinaryResult = await cloudinary_service_1.CloudinaryMediaService.destroyImagesByDeliveryUrls(imageUrls);
        const mongoResult = await body_fat_model_1.BodyFatEstimate.deleteMany({});
        const result = {
            estimatesFound: estimates.length,
            uniqueImageUrls: imageUrls.length,
            cloudinaryAttempted: cloudinaryResult.attempted,
            cloudinaryDeleted: cloudinaryResult.deleted,
            cloudinaryFailed: cloudinaryResult.failed,
            skippedInvalidUrls: cloudinaryResult.skippedInvalidUrls,
            mongoDeleted: mongoResult.deletedCount ?? 0,
        };
        logger_service_1.logger.info('BodyFatCleanupService: purge complete', result);
        return result;
    }
}
exports.BodyFatCleanupService = BodyFatCleanupService;
