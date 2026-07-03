"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthSyncSchedulerService = void 0;
const logger_service_1 = require("../../services/logger.service");
const google_health_snapshot_service_1 = require("./google-health-snapshot.service");
const health_sync_window_1 = require("./health-sync-window");
class HealthSyncSchedulerService {
    static async runTick() {
        if (!(0, health_sync_window_1.isWithinSyncWindow)()) {
            logger_service_1.logger.info('HealthSyncScheduler: skipped — outside sync window');
            return;
        }
        const userIds = await google_health_snapshot_service_1.GoogleHealthSnapshotService.listConnectedUserIds();
        let updated = 0;
        let skipped = 0;
        let errors = 0;
        for (const userId of userIds) {
            try {
                const result = await google_health_snapshot_service_1.GoogleHealthSnapshotService.syncUserSnapshot(userId);
                if (result.status === 'updated') {
                    updated += 1;
                }
                else {
                    skipped += 1;
                }
            }
            catch (err) {
                errors += 1;
                logger_service_1.logger.error(`HealthSyncScheduler: failed to sync user ${userId}`, err);
            }
        }
        logger_service_1.logger.info(`HealthSyncScheduler: tick complete users=${userIds.length} updated=${updated} skipped=${skipped} errors=${errors}`);
    }
}
exports.HealthSyncSchedulerService = HealthSyncSchedulerService;
