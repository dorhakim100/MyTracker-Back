"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBodyFatCleanupCron = startBodyFatCleanupCron;
const body_fat_cleanup_service_1 = require("../api/body-fat/body-fat.cleanup.service");
const logger_service_1 = require("../services/logger.service");
const cron_service_1 = require("./cron.service");
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
    (0, cron_service_1.startCron)(runBodyFatCleanup);
}
