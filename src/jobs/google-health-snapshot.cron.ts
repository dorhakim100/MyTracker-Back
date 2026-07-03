import { HealthSyncSchedulerService } from '../api/health/health-sync-scheduler.service'
import { logger } from '../services/logger.service'
import { startCron } from './cron.service'

const HEALTH_SYNC_CRON_EXPRESSION = '*/5 * * * *'
const HEALTH_SYNC_CRON_TIMEZONE = 'Asia/Jerusalem'

let isRunning = false

async function runGoogleHealthSnapshotSync(): Promise<void> {
  if (isRunning) {
    logger.warn(
      'GoogleHealthSnapshotCron: skipped — previous run still in progress'
    )
    return
  }

  isRunning = true

  try {
    await HealthSyncSchedulerService.runTick()
  } catch (err) {
    logger.error('GoogleHealthSnapshotCron: tick failed', err)
  } finally {
    isRunning = false
  }
}

export function startGoogleHealthSnapshotCron(): void {
  startCron(
    runGoogleHealthSnapshotSync,
    HEALTH_SYNC_CRON_EXPRESSION,
    HEALTH_SYNC_CRON_TIMEZONE
  )
}
