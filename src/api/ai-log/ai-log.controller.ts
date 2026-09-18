import { Response } from 'express'
import { AuthRequest } from '../../middleware/auth.middleware'
import { AiLogService } from './ai-log.service'
import { logger } from '../../services/logger.service'

export class AiLogController {
  static async estimate(req: AuthRequest, res: Response) {
    try {
      const { imageUrl, text } = req.body as {
        imageUrl?: string
        text?: string
      }
      const result = await AiLogService.estimate({
        userId: req.user?._id || req.user?.id,
        imageUrl,
        text,
      })
      res.json(result)
    } catch (err: any) {
      const statusCode = err.statusCode || 500
      if (statusCode >= 500) {
        logger.error('AiLogController.estimate failed', err)
      }
      res.status(statusCode).send({
        err: err.message || 'Failed to estimate food',
      })
    }
  }
}
