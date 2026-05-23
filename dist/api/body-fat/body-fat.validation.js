"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidCloudinaryUrl = isValidCloudinaryUrl;
exports.clampBodyFatRange = clampBodyFatRange;
const CLOUDINARY_HOST = 'res.cloudinary.com';
function isValidCloudinaryUrl(url) {
    try {
        const parsed = new URL(url);
        return (parsed.protocol === 'https:' &&
            parsed.hostname === CLOUDINARY_HOST &&
            parsed.pathname.length > 1);
    }
    catch {
        return false;
    }
}
const MIN_BODY_FAT = 3;
const MAX_BODY_FAT = 60;
function clampBodyFatRange(minPercent, maxPercent) {
    let min = Math.min(minPercent, maxPercent);
    let max = Math.max(minPercent, maxPercent);
    min = Math.max(MIN_BODY_FAT, Math.min(MAX_BODY_FAT, min));
    max = Math.max(MIN_BODY_FAT, Math.min(MAX_BODY_FAT, max));
    if (min > max) {
        min = MIN_BODY_FAT;
        max = MAX_BODY_FAT;
    }
    return { minPercent: min, maxPercent: max };
}
