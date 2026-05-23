"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BodyFatGeminiService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const logger_service_1 = require("../../../services/logger.service");
const body_fat_validation_1 = require("../body-fat.validation");
const body_fat_prompt_1 = require("./body-fat.prompt");
const body_fat_schema_1 = require("./body-fat.schema");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
async function fetchImageAsBase64(imageUrl) {
    const response = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const mimeType = contentType.split(';')[0].trim();
    if (!mimeType.startsWith('image/')) {
        throw new Error('URL did not return an image');
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_IMAGE_BYTES) {
        throw new Error('Image too large');
    }
    return { base64: buffer.toString('base64'), mimeType };
}
function parseGeminiEstimate(raw) {
    const minPercent = Number(raw.minPercent);
    const maxPercent = Number(raw.maxPercent);
    const note = typeof raw.note === 'string' ? raw.note.trim() : '';
    if (!Number.isFinite(minPercent) ||
        !Number.isFinite(maxPercent) ||
        !note) {
        throw new Error('Invalid structured response from Gemini');
    }
    const clamped = (0, body_fat_validation_1.clampBodyFatRange)(minPercent, maxPercent);
    return { ...clamped, note };
}
class BodyFatGeminiService {
    static async estimateFromImageUrl(imageUrl, weightKg) {
        if (!GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured');
        }
        const imageData = await fetchImageAsBase64(imageUrl);
        const genAI = new generative_ai_1.GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
            model: GEMINI_MODEL,
            generationConfig: {
                responseMimeType: 'application/json',
                responseSchema: body_fat_schema_1.bodyFatResponseSchema,
            },
        });
        const result = await model.generateContent([
            { text: (0, body_fat_prompt_1.getPrompt)(weightKg) },
            {
                inlineData: {
                    mimeType: imageData.mimeType,
                    data: imageData.base64,
                },
            },
        ]);
        const text = result.response.text();
        if (!text) {
            throw new Error('Empty response from Gemini');
        }
        let parsed;
        try {
            parsed = JSON.parse(text);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to parse Gemini JSON', err, text);
            throw new Error('Invalid JSON from Gemini');
        }
        return parseGeminiEstimate(parsed);
    }
}
exports.BodyFatGeminiService = BodyFatGeminiService;
