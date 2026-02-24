"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TranslateService = void 0;
const logger_service_1 = require("../../services/logger.service");
const translate_1 = require("@google-cloud/translate");
const lru_cache_1 = require("lru-cache");
const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
const projectId = process.env.GOOGLE_PROJECT_ID;
const translateClient = new translate_1.v2.Translate({
    credentials: {
        client_email: clientEmail,
        private_key: privateKey,
    },
    projectId: projectId,
});
const cache = new lru_cache_1.LRUCache({
    max: 20000,
    ttl: 180 * 24 * 60 * 60 * 1000, // 180 days
    updateAgeOnGet: true, // sliding TTL
    ttlAutopurge: true,
});
const stripNiqqud = (s) => s.replace(/[\u0591-\u05BD\u05BF-\u05C7]/g, '');
const normKey = (q, target) => {
    const cleaned = stripNiqqud(q).trim().replace(/\s+/g, ' ').toLowerCase();
    return `${cleaned}::${target}`;
};
class TranslateService {
    static async translate(q, target = 'en') {
        try {
            const key = normKey(q, target);
            const cached = cache.get(key);
            if (cached)
                return cached.value;
            const [translated] = await translateClient.translate(q, target);
            const newTranslate = { key: key, value: translated };
            cache.set(key, newTranslate);
            return newTranslate.value;
        }
        catch (err) {
            logger_service_1.logger.error('Failed to translate', err);
            throw err;
        }
    }
}
exports.TranslateService = TranslateService;
