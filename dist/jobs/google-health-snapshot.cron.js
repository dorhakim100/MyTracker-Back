"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startGoogleHealthSnapshotCron = startGoogleHealthSnapshotCron;
const health_sync_scheduler_service_1 = require("../api/health/health-sync-scheduler.service");
const logger_service_1 = require("../services/logger.service");
const cron_service_1 = require("./cron.service");
const HEALTH_SYNC_CRON_EXPRESSION = '*/5 * * * *';
const HEALTH_SYNC_CRON_TIMEZONE = 'Asia/Jerusalem';
let isRunning = false;
async function runGoogleHealthSnapshotSync() {
    if (isRunning) {
        logger_service_1.logger.warn('GoogleHealthSnapshotCron: skipped — previous run still in progress');
        return;
    }
    isRunning = true;
    try {
        await health_sync_scheduler_service_1.HealthSyncSchedulerService.runTick();
    }
    catch (err) {
        logger_service_1.logger.error('GoogleHealthSnapshotCron: tick failed', err);
    }
    finally {
        isRunning = false;
    }
}
function startGoogleHealthSnapshotCron() {
    (0, cron_service_1.startCron)(runGoogleHealthSnapshotSync, HEALTH_SYNC_CRON_EXPRESSION, HEALTH_SYNC_CRON_TIMEZONE);
}
