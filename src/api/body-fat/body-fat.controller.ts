import { Request, Response } from 'express'
import { BodyFatService } from './body-fat.service'
import { logger } from '../../services/logger.service'

export class BodyFatController {
  static async estimate(req: Request, res: Response) {
    try {
      const { userId, imageUrl, weightKg } = req.body as { userId?: string; imageUrl?: string; weightKg?: number }

      if (!userId || !imageUrl || !weightKg) {
        return res.status(400).send({ err: 'userId, imageUrl, and weightKg are required' })
      }

      const result = await BodyFatService.estimate(userId, imageUrl, weightKg)
      res.json(result)
    } catch (err: any) {
      const statusCode = err.statusCode || 500
      if (statusCode >= 500) {
        logger.error('BodyFatController.estimate failed', err)
      }
      res.status(statusCode).send({
        err: err.message || 'Failed to estimate body fat',
      })
    }
  }
}
