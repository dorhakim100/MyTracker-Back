import { AiPlateCleanupService } from '../api/ai-log/ai-log.cleanup.service'
import { logger } from '../services/logger.service'
import { startCron } from './cron.service'

let isRunning = false

async function runAiPlateCleanup(): Promise<void> {
  if (isRunning) {
    logger.warn('AiPlateCleanupCron: skipped — previous run still in progress')
    return
  }

  isRunning = true
  try {
    await AiPlateCleanupService.purgeExpired()
  } catch (err) {
    logger.error('AiPlateCleanupCron: purge failed', err)
  } finally {
    isRunning = false
  }
}

export function startAiPlateCleanupCron(): void {
  startCron(runAiPlateCleanup)
}
