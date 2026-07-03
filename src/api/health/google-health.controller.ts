import { Response } from 'express'
import { GoogleHealthService } from './google-health.service'
import { GoogleHealthSnapshotService } from './google-health-snapshot.service'
import { logger } from '../../services/logger.service'
import type { AuthRequest } from '../../middleware/auth.middleware'

export class GoogleHealthController {
  static async getStatus(req: AuthRequest, res: Response) {
    try {
      const userId = req.query.userId as string
      if (!userId) {
        return
      }

      const status = await GoogleHealthService.getStatus(userId)
      res.json(status)
    } catch (err) {
      logger.error('Failed to get Google Health status', err)
      res.status(500).send({ err: 'Failed to get Google Health status' })
    }
  }

  static async getTodayActivitySummary(req: AuthRequest, res: Response) {
    try {
      const userId = req.query.userId as string
      if (!userId) {
        return
      }

      const summary = await GoogleHealthService.getTodayActivitySummary(userId)
      return res.json(summary)
    } catch (err) {
      logger.error('Failed to get Google Health activity summary', err)
      return res
        .status(500)
        .send({ err: 'Failed to get Google Health activity summary' })
    }
  }

  static async getSnapshot(req: AuthRequest, res: Response) {
    try {
      const userId = req.query.userId as string
      if (!userId) {
        return
      }

      const snapshot = await GoogleHealthSnapshotService.getSnapshotForUser(userId)
      return res.json(snapshot)
    } catch (err) {
      logger.error('Failed to get Google Health snapshot', err)
      return res.status(500).send({ err: 'Failed to get Google Health snapshot' })
    }
  }
}
