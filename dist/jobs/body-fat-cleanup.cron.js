"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBodyFatCleanupCron = startBodyFatCleanupCron;
const node_cron_1 = __importDefault(require("node-cron"));
const body_fat_cleanup_service_1 = require("../api/body-fat/body-fat.cleanup.service");
const logger_service_1 = require("../services/logger.service");
const CRON_EXPRESSION = '0 4 * * *';
const CRON_TIMEZONE = 'Asia/Jerusalem';
let isRunning = false;
async function runBodyFatCleanup() {
    if (isRunning) {
        logger_service_1.logger.warn('BodyFatCleanupCron: skipped — previous run still in progress');
        return;
    }
    isRunning = true;
    try {
        await body_fat_cleanup_service_1.BodyFatCleanupService.purgeAll();
    }
    catch (err) {
        logger_service_1.logger.error('BodyFatCleanupCron: purge failed', err);
    }
    finally {
        isRunning = false;
    }
}
function startBodyFatCleanupCron() {
    node_cron_1.default.schedule(CRON_EXPRESSION, () => {
        void runBodyFatCleanup();
    }, {
        timezone: CRON_TIMEZONE,
    });
    logger_service_1.logger.info(`BodyFatCleanupCron: scheduled daily at 04:00 ${CRON_TIMEZONE} (${CRON_EXPRESSION})`);
}
