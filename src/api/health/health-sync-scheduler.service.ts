import { logger } from '../../services/logger.service'
import { addDays } from './activity-dates'
import { GoogleHealthSnapshotService } from './google-health-snapshot.service'
import { getIsraelDateKey, isWithinSyncWindow } from './health-sync-window'

export class HealthSyncSchedulerService {
  static async runTick(force = false): Promise<void> {
    if (!force && !isWithinSyncWindow()) {
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
      `HealthSyncScheduler: tick complete${force ? ' (end of day)' : ''} users=${userIds.length} updated=${updated} skipped=${skipped} errors=${errors}`
    )
  }

  static async runPreviousDayTick(): Promise<void> {
    const date = addDays(getIsraelDateKey(), -1)
    const userIds = await GoogleHealthSnapshotService.listConnectedUserIds()
    let updated = 0
    let skipped = 0
    let errors = 0

    for (const userId of userIds) {
      try {
        const result = await GoogleHealthSnapshotService.syncUserDate(
          userId,
          date
        )
        if (result.status === 'updated') updated += 1
        else skipped += 1
      } catch (err) {
        errors += 1
        logger.error(
          `HealthSyncScheduler: failed to sync previous day for ${userId}`,
          err
        )
      }
    }

    logger.info(
      `HealthSyncScheduler: previous day ${date} users=${userIds.length} updated=${updated} skipped=${skipped} errors=${errors}`
    )
  }
}
