import { Request, Response } from 'express'
import { logger } from '../../services/logger.service'
import { TranslateService } from './translate.service'

export class TranslateController {
  static async translate(req: Request, res: Response) {
    try {
      const text = req.query.q
      const target = req.query.target

      if (!text) {
        return
      }

      const translated = await TranslateService.translate(
        text as string,
        target as string
      )

      res.json(translated)
    } catch (err: any) {
      logger.error('Failed to translate', err)
      res.status(500).send({ err: 'Failed to translate' })
    }
  }
}
