import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware'
import { logger } from '../../services/logger.service'
import { StatsService } from './stats.service'
import { buildWeekSummary } from './stats.week'
import { buildDistribution } from './stats.distribution'
import { DistributionTimeframe, WeekMode } from '../../utils/israel-date.util'

function userIdFrom(req: AuthRequest) {
  return req.user?._id || req.user?.id || ''
}

export class StatsController {
  static async openFrame(req: AuthRequest, res: Response) {
    try {
      const stats = await StatsService.openFrame(
        req.params.sessionId,
        userIdFrom(req)
      )
      res.json(stats)
    } catch (err: any) {
      const statusCode = err.statusCode || 500
      logger.error('StatsController.openFrame failed', err)
      res.status(statusCode).send({ err: err.message || 'Failed to open frame' })
    }
  }

  static async finish(req: AuthRequest, res: Response) {
    try {
      const recap = await StatsService.finish(
        req.params.sessionId,
        userIdFrom(req)
      )
      res.json(recap)
    } catch (err: any) {
      const statusCode = err.statusCode || 500
      logger.error('StatsController.finish failed', err)
      res.status(statusCode).send({ err: err.message || 'Failed to finish stats' })
    }
  }

  static async getWeek(req: AuthRequest, res: Response) {
    try {
      const forUserId = String(req.query.forUserId || '')
      const mode = String(req.query.mode || '')
      if (!forUserId || (mode !== 'thisWeek' && mode !== 'last7')) {
        res.status(400).send({ err: 'Invalid week summary' })
        return
      }
      const summary = await buildWeekSummary(forUserId, mode as WeekMode)
      res.json(summary)
    } catch (err: any) {
      logger.error('StatsController.getWeek failed', err)
      res.status(500).send({ err: 'Failed to get week summary' })
    }
  }

  static async getDistribution(req: AuthRequest, res: Response) {
    try {
      const forUserId = String(req.query.forUserId || '')
      const timeframe = String(req.query.timeframe || '')
      const allowed = ['thisWeek', '7d', '30d', 'year', 'all']
      if (!forUserId || !allowed.includes(timeframe)) {
        res.status(400).send({ err: 'Invalid distribution' })
        return
      }
      const includePrevious = req.query.includePrevious === 'true'
      const distribution = await buildDistribution(
        forUserId,
        timeframe as DistributionTimeframe,
        includePrevious
      )
      res.json(distribution)
    } catch (err: any) {
      logger.error('StatsController.getDistribution failed', err)
      res.status(500).send({ err: 'Failed to get distribution' })
    }
  }

  static async getRecap(req: AuthRequest, res: Response) {
    try {
      const recap = await StatsService.getRecap(req.params.sessionId)
      res.json(recap)
    } catch (err: any) {
      const statusCode = err.statusCode || 500
      logger.error('StatsController.getRecap failed', err)
      res.status(statusCode).send({ err: err.message || 'Failed to get stats' })
    }
  }
}
