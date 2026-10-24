import { Request, Response } from 'express'
import { BodyFatService } from './body-fat.service'
import { logger } from '../../services/logger.service'

const MEASUREMENT_KEYS = [
  'waist',
  'neck',
  'chest',
  'arms',
  'hips',
  'thigh',
  'calf',
] as const

function readMeasurements(value: unknown) {
  if (!value || typeof value !== 'object') return undefined
  const source = value as Record<string, unknown>
  const measurements: Record<string, number> = {}

  MEASUREMENT_KEYS.forEach((key) => {
    const numeric = Number(source[key])
    if (Number.isFinite(numeric)) measurements[key] = numeric
  })

  return Object.keys(measurements).length ? measurements : undefined
}

export class BodyFatController {
  static async estimate(req: Request, res: Response) {
    try {
      const { userId, imageUrl, weightKg, measurements } = req.body as {
        userId?: string
        imageUrl?: string
        weightKg?: number
        measurements?: unknown
      }

      if (!userId || !imageUrl || !weightKg) {
        return res.status(400).send({ err: 'userId, imageUrl, and weightKg are required' })
      }

      const result = await BodyFatService.estimate(
        userId,
        imageUrl,
        weightKg,
        readMeasurements(measurements)
      )
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
