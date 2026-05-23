"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BodyFatService = void 0;
const generative_ai_1 = require("@google/generative-ai");
const zod_1 = require("zod");
const logger_service_1 = require("../../services/logger.service");
const bodyFat_prompt_1 = require("./bodyFat.prompt");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const estimateSchema = zod_1.z.discriminatedUnion('status', [
    zod_1.z.object({
        status: zod_1.z.literal('ok'),
        bodyFatMin: zod_1.z.number(),
        bodyFatMax: zod_1.z.number(),
        note: zod_1.z.string().min(1),
    }),
    zod_1.z.object({
        status: zod_1.z.literal('unusable_photo'),
        message: zod_1.z.string().min(1),
    }),
    zod_1.z.object({
        status: zod_1.z.literal('error'),
        message: zod_1.z.string().min(1),
    }),
]);
class BodyFatService {
    static async estimate(input) {
        if (!GEMINI_API_KEY) {
            logger_service_1.logger.error('GEMINI_API_KEY is not configured');
            return {
                status: 'error',
                message: 'Body fat estimation is not configured on the server.',
            };
        }
        try {
            const { base64, mimeType } = await fetchImageAsBase64(input.imageUrl);
            const genAI = new generative_ai_1.GoogleGenerativeAI(GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({
                model: GEMINI_MODEL,
                generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: 0.4,
                },
            });
            const prompt = (0, bodyFat_prompt_1.buildBodyFatEstimatePrompt)(input.weightKg);
            const result = await model.generateContent([
                { inlineData: { data: base64, mimeType } },
                { text: prompt },
            ]);
            const rawText = result.response.text();
            const parsed = parseModelJson(rawText);
            const validated = estimateSchema.safeParse(parsed);
            if (!validated.success) {
                logger_service_1.logger.error('Invalid Gemini body fat response', validated.error);
                return {
                    status: 'error',
                    message: 'Could not parse the estimation response. Please try again.',
                };
            }
            const data = validated.data;
            if (data.status === 'ok') {
                const min = roundPercent(data.bodyFatMin);
                const max = roundPercent(data.bodyFatMax);
                if (min > max || min < 0 || max > 100) {
                    return {
                        status: 'error',
                        message: 'Received an invalid body fat range. Please try again.',
                    };
                }
                return {
                    status: 'ok',
                    bodyFatMin: min,
                    bodyFatMax: max,
                    note: data.note.trim(),
                };
            }
            return {
                status: data.status,
                message: data.message.trim(),
            };
        }
        catch (err) {
            logger_service_1.logger.error('BodyFatService.estimate failed', err);
            return {
                status: 'error',
                message: 'Failed to analyze the photo. Please try again later.',
            };
        }
    }
}
exports.BodyFatService = BodyFatService;
async function fetchImageAsBase64(imageUrl) {
    const response = await fetch(imageUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
    }
    const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim() ||
        'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());
    const base64 = buffer.toString('base64');
    return { base64, mimeType };
}
function parseModelJson(rawText) {
    const trimmed = rawText.trim();
    const withoutFence = trimmed
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    return JSON.parse(withoutFence);
}
function roundPercent(value) {
    return Math.round(value * 10) / 10;
}
