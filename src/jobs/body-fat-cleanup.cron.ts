import cron from 'node-cron'
import { BodyFatCleanupService } from '../api/body-fat/body-fat.cleanup.service'
import { logger } from '../services/logger.service'
import { startCron } from './cron.service'

let isRunning = false

async function runBodyFatCleanup(): Promise<void> {
  if (isRunning) {
    logger.warn('BodyFatCleanupCron: skipped — previous run still in progress')
    return
  }

  isRunning = true

  try {
    await BodyFatCleanupService.purgeAll()
  } catch (err) {
    logger.error('BodyFatCleanupCron: purge failed', err)
  } finally {
    isRunning = false
  }
}

export function startBodyFatCleanupCron(): void {
  startCron(runBodyFatCleanup)
}
