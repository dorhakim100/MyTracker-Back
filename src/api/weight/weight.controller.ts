import { Request, Response } from 'express'
import { WeightService } from './weight.service'
import { logger } from '../../services/logger.service'
import { isChartRange } from '../../utils/chart-series.util'

function readPageCount(value: string | undefined) {
  if (!value) return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return undefined
  return parsed
}

export class WeightController {
  static async getWeightsByUser(req: Request, res: Response) {
    try {
      const { userId, fromDate, toDate, skip, limit } = req.query as {
        userId: string
        fromDate: string | null
        toDate: string | null
        skip?: string
        limit?: string
      }

      if (userId) {
        const weights = await WeightService.listByUser(
          userId,
          fromDate,
          toDate,
          readPageCount(skip),
          readPageCount(limit)
        )
        return res.json(weights)
      }
      const weights = await WeightService.query(req.query as any)
      return res.json(weights)
    } catch (err: any) {
      logger.error('Failed to get weights', err)
      res.status(500).send({ err: 'Failed to get weights' })
    }
  }

  static async getChart(req: Request, res: Response) {
    try {
      const { userId, range } = req.query as { userId: string; range?: string }
      if (!isChartRange(range)) {
        return res.status(400).send({ err: 'Invalid chart range' })
      }
      const chart = await WeightService.getChart(userId, range)
      res.json(chart)
    } catch (err: any) {
      logger.error('Failed to get weight chart', err)
      res.status(500).send({ err: 'Failed to get weight chart' })
    }
  }

  static async getWeightById(req: Request, res: Response) {
    try {
      const weight = await WeightService.getById(req.params.id)
      if (!weight) return res.status(404).send({ err: 'Weight not found' })
      res.json(weight)
    } catch (err: any) {
      logger.error('Failed to get weight', err)
      res.status(500).send({ err: 'Failed to get weight' })
    }
  }

  static async add(req: Request, res: Response) {
    try {
      const added = await WeightService.add(req.body)
      res.json(added)
    } catch (err: any) {
      logger.error('Failed to add weight', err)
      res.status(500).send({ err: 'Failed to add weight' })
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const updated = await WeightService.update(req.params.id, req.body)
      res.json(updated)
    } catch (err: any) {
      logger.error('Failed to update weight', err)
      res.status(500).send({ err: 'Failed to update weight' })
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      await WeightService.remove(req.params.id)
      res.send({ msg: 'Deleted successfully' })
    } catch (err: any) {
      logger.error('Failed to delete weight', err)
      res.status(500).send({ err: 'Failed to delete weight' })
    }
  }
}
