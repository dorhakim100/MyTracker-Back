import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware'
import { logger } from '../../services/logger.service'
import { StatsService } from './stats.service'

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
