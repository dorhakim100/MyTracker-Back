import { Request, Response } from 'express'
import { WeightService } from './weight.service'
import { logger } from '../../services/logger.service'

export class WeightController {
  static async getWeightsByUser(req: Request, res: Response) {
    try {
      const { userId, fromDate, toDate } = req.query as {
        userId?: string
        fromDate?: string
        toDate?: string
      }

      if (userId) {
        const weights = await WeightService.listByUser(
          userId,
          fromDate || '',
          toDate || ''
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
