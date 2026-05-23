"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryMediaService = void 0;
exports.extractPublicIdFromCloudinaryUrl = extractPublicIdFromCloudinaryUrl;
const cloudinary_1 = require("cloudinary");
const body_fat_validation_1 = require("../../api/body-fat/body-fat.validation");
const logger_service_1 = require("../logger.service");
const DELETE_RESOURCES_BATCH_SIZE = 100;
function isConfigured() {
    return Boolean(process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET);
}
function configureCloudinary() {
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });
}
function isTransformationSegment(segment) {
    if (/^v\d+$/.test(segment)) {
        return true;
    }
    if (segment.includes(',')) {
        return true;
    }
    if (/^[a-z]{1,3}_[\w,.]+$/.test(segment)) {
        return true;
    }
    return false;
}
function extractPublicIdFromCloudinaryUrl(url) {
    if (!(0, body_fat_validation_1.isValidCloudinaryUrl)(url)) {
        return null;
    }
    try {
        const parsed = new URL(url);
        const uploadMarker = '/upload/';
        const uploadIndex = parsed.pathname.indexOf(uploadMarker);
        if (uploadIndex === -1) {
            return null;
        }
        const segments = parsed.pathname
            .slice(uploadIndex + uploadMarker.length)
            .split('/')
            .filter(Boolean);
        while (segments.length > 0 && isTransformationSegment(segments[0])) {
            segments.shift();
        }
        if (segments.length === 0) {
            return null;
        }
        const publicIdWithExt = segments.join('/');
        return publicIdWithExt.replace(/\.[^/.]+$/, '');
    }
    catch {
        return null;
    }
}
function countDeletedFromBatchResponse(result) {
    if (!result) {
        return { deleted: 0, failed: 0 };
    }
    let deleted = 0;
    let failed = 0;
    for (const status of Object.values(result)) {
        if (status === 'deleted' || status === 'not_found') {
            deleted += 1;
        }
        else {
            failed += 1;
        }
    }
    return { deleted, failed };
}
class CloudinaryMediaService {
    static isConfigured() {
        return isConfigured();
    }
    static async destroyImagesByDeliveryUrls(imageUrls) {
        if (!isConfigured()) {
            logger_service_1.logger.warn('CloudinaryMediaService: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET is missing; skipping image deletes');
            return {
                attempted: 0,
                deleted: 0,
                failed: 0,
                skippedInvalidUrls: 0,
            };
        }
        configureCloudinary();
        const publicIds = [];
        let skippedInvalidUrls = 0;
        for (const url of imageUrls) {
            const publicId = extractPublicIdFromCloudinaryUrl(url);
            if (!publicId) {
                skippedInvalidUrls += 1;
                logger_service_1.logger.warn('CloudinaryMediaService: could not parse public_id from URL', url);
                continue;
            }
            publicIds.push(publicId);
        }
        const uniquePublicIds = [...new Set(publicIds)];
        let deleted = 0;
        let failed = 0;
        for (let i = 0; i < uniquePublicIds.length; i += DELETE_RESOURCES_BATCH_SIZE) {
            const batch = uniquePublicIds.slice(i, i + DELETE_RESOURCES_BATCH_SIZE);
            try {
                const response = await cloudinary_1.v2.api.delete_resources(batch, {
                    resource_type: 'image',
                    type: 'upload',
                });
                const counts = countDeletedFromBatchResponse(response.deleted);
                deleted += counts.deleted;
                failed += counts.failed;
            }
            catch (err) {
                failed += batch.length;
                logger_service_1.logger.error('CloudinaryMediaService: delete_resources batch failed', err);
            }
        }
        return {
            attempted: uniquePublicIds.length,
            deleted,
            failed,
            skippedInvalidUrls,
        };
    }
}
exports.CloudinaryMediaService = CloudinaryMediaService;
