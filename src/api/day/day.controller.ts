import { Request, Response } from 'express'
import { DayService } from './day.service'

export class DayController {
  static async get(req: Request, res: Response) {
    const { date, userId } = req.query as { date: string; userId: string }
    try {
      const days = await DayService.getByUserAndDate(userId, date)

      res.json(days)
    } catch (err: any) {
      res.status(500).send({ err: 'Failed to get days' })
    }
  }

  static async upsert(req: Request, res: Response) {
    try {
      const { userId, date, logs, calories } = req.body
      const day = await DayService.upsertFromLoggedToday({
        userId,
        date,
        logs,
        calories,
      })
      res.json(day)
    } catch (err: any) {
      res.status(400).send({ err: err.message || 'Failed to upsert day' })
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const day = await DayService.getById(req.params.id)
      if (!day) return res.status(404).send({ err: 'Day not found' })
      res.json(day)
    } catch (err: any) {
      res.status(500).send({ err: 'Failed to get day' })
    }
  }

  static async getByDate(req: Request, res: Response) {
    try {
      const { userId } = req.params
      const { date } = req.query as { date: string }
      const day = await DayService.getByUserAndDate(userId, date)
      if (!day) return res.status(404).send({ err: 'Day not found' })
      res.json(day)
    } catch (err: any) {
      res.status(500).send({ err: 'Failed to get day' })
    }
  }

  static async listByUser(req: Request, res: Response) {
    try {
      const { userId } = req.params
      const limit = parseInt(String(req.query.limit || '30'), 10)
      const days = await DayService.listByUser(userId, limit)
      res.json(days)
    } catch (err: any) {
      res.status(500).send({ err: 'Failed to list days' })
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const day = await DayService.update(req.body)
      res.json(day)
    } catch (err: any) {
      res.status(500).send({ err: 'Failed to update day' })
    }
  }
}
