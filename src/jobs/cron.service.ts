import cron from "node-cron"
import { logger } from "../services/logger.service"

const CRON_EXPRESSION = '0 4 * * *'
const CRON_TIMEZONE = 'Asia/Jerusalem'


export function startCron(job: () => Promise<void>,cronExpression: string = CRON_EXPRESSION, cronTimezone: string = CRON_TIMEZONE): void {
  cron.schedule(cronExpression, () => {
    void job()
  }, {
    timezone: cronTimezone,
  })

  logger.info(`Cron: scheduled daily at 04:00 ${cronTimezone} (${cronExpression})`)
}
