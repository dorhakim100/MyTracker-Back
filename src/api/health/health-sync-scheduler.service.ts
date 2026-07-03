import { logger } from '../../services/logger.service'
import { GoogleHealthSnapshotService } from './google-health-snapshot.service'
import { isWithinSyncWindow } from './health-sync-window'

export class HealthSyncSchedulerService {
  static async runTick(): Promise<void> {
    if (!isWithinSyncWindow()) {
      logger.info('HealthSyncScheduler: skipped — outside sync window')
      return
    }

    const userIds = await GoogleHealthSnapshotService.listConnectedUserIds()
    let updated = 0
    let skipped = 0
    let errors = 0

    for (const userId of userIds) {
      try {
        const result = await GoogleHealthSnapshotService.syncUserSnapshot(userId)

        if (result.status === 'updated') {
          updated += 1
        } else {
          skipped += 1
        }
      } catch (err) {
        errors += 1
        logger.error(
          `HealthSyncScheduler: failed to sync user ${userId}`,
          err
        )
      }
    }

    logger.info(
      `HealthSyncScheduler: tick complete users=${userIds.length} updated=${updated} skipped=${skipped} errors=${errors}`
    )
  }
}
