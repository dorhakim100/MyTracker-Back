import { Response } from 'express'
import type { AuthRequest } from '../../middleware/auth.middleware'
import { logger } from '../../services/logger.service'
import { ActivityDayService } from './activity-day.service'
import { ActivityPageService } from './activity-page.service'
import {
  ActivityGoogleService,
  logBackfillFailure,
} from './activity-google.service'
import type { ActivityVendor } from './activity-day.model'
import type { ActivityFrame, ActivityMetric } from './activity-page.service'

const METRICS: ActivityMetric[] = ['steps', 'calories']
const FRAMES: ActivityFrame[] = ['week', 'month', 'quarter', 'year']
const VENDORS: ActivityVendor[] = ['google', 'native']

export class ActivityController {
  static async getPage(req: AuthRequest, res: Response) {
    try {
      const userId = req.query.userId as string
      const metric = req.query.metric as ActivityMetric
      const frame = req.query.frame as ActivityFrame
      const vendor = (req.query.vendor as ActivityVendor) || 'native'
      const end = req.query.end as string | undefined

      if (!userId || !METRICS.includes(metric) || !FRAMES.includes(frame)) {
        return res.status(400).send({ err: 'Invalid activity page request' })
      }
      if (!VENDORS.includes(vendor)) {
        return res.status(400).send({ err: 'Invalid activity vendor' })
      }

      const page = await ActivityPageService.getPage(
        userId,
        metric,
        frame,
        vendor,
        end
      )
      return res.json(page)
    } catch (err) {
      logger.error('Failed to get activity page', err)
      return res.status(500).send({ err: 'Failed to get activity page' })
    }
  }

  static async saveDays(req: AuthRequest, res: Response) {
    try {
      const userId = req.body?.userId as string
      const days = req.body?.days
      if (!userId || !Array.isArray(days)) {
        return res.status(400).send({ err: 'Invalid activity days' })
      }

      const cleaned = days
        .filter(
          (day) =>
            day &&
            typeof day.date === 'string' &&
            /^\d{4}-\d{2}-\d{2}$/.test(day.date)
        )
        .map((day) => ({
          date: day.date as string,
          steps: Number(day.steps) || 0,
          calories: Number(day.calories) || 0,
        }))

      await ActivityDayService.upsertDays(userId, 'native', cleaned)
      return res.json({ saved: cleaned.length })
    } catch (err) {
      logger.error('Failed to save activity days', err)
      return res.status(500).send({ err: 'Failed to save activity days' })
    }
  }

  static async saveGoogle(req: AuthRequest, res: Response) {
    try {
      const userId = req.body?.userId as string
      const start = req.body?.start as string
      const end = req.body?.end as string
      if (!userId || !start || !end) {
        return res.status(400).send({ err: 'Invalid Google activity range' })
      }

      const result = await ActivityGoogleService.saveRange(userId, start, end)
      return res.json(result)
    } catch (err) {
      logger.error('Failed to save Google activity range', err)
      return res.status(500).send({ err: 'Failed to save Google activity range' })
    }
  }

  static async backfill(req: AuthRequest, res: Response) {
    try {
      const userId = req.body?.userId as string
      if (!userId) return res.status(400).send({ err: 'Missing userId' })

      res.json({ started: true })
      ActivityGoogleService.backfill(userId).catch(logBackfillFailure)
    } catch (err) {
      logger.error('Failed to start activity backfill', err)
      return res.status(500).send({ err: 'Failed to start activity backfill' })
    }
  }
}
