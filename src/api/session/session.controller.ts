import { Request, Response } from 'express'
import { SessionService } from './session.service'
import { logger } from '../../services/logger.service'
import { log } from 'node:console'

export class SessionController {
  static async get(req: Request, res: Response) {
    const { date, userId } = req.query as { date: string; userId: string }

    let sessionToSend = null

    try {
      if (!userId || !date) {
        return res.status(400).send({ err: 'userId and date are required' })
      }

      const session = await SessionService.getByUserAndDate(userId, date)

      if (!session) {
        sessionToSend = await SessionService.add({ userId, date })
      } else {
        sessionToSend = session
      }
      res.json(sessionToSend)
    } catch (err: any) {
      logger.error('Failed to get sessions', err)
      res.status(500).send({ err: 'Failed to get sessions' })
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const session = await SessionService.getById(req.params.id)
      if (!session) return res.status(404).send({ err: 'Session not found' })
      res.json(session)
    } catch (err: any) {
      logger.error('Failed to get session', err)
      res.status(500).send({ err: 'Failed to get session' })
    }
  }

  static async getByDate(req: Request, res: Response) {
    try {
      const { userId } = req.params
      const { date } = req.query as { date: string }
      const sessions = await SessionService.getByUserAndDate(userId, date)
      res.json(sessions)
    } catch (err: any) {
      logger.error('Failed to get sessions by date', err)
      res.status(500).send({ err: 'Failed to get sessions by date' })
    }
  }

  static async listByUser(req: Request, res: Response) {
    try {
      const { userId } = req.params
      const limit = parseInt(String(req.query.limit || '30'), 10)
      const filterBy = { ...req.query }
      delete filterBy.limit

      const sessions = await SessionService.listByUser(userId, limit, filterBy)
      res.json(sessions)
    } catch (err: any) {
      logger.error('Failed to list sessions by user', err)
      res.status(500).send({ err: 'Failed to list sessions by user' })
    }
  }

  static async add(req: Request & { user?: { _id: string } }, res: Response) {
    try {
      const session = req.body

      const addedSession = await SessionService.add(session)
      res.json(addedSession)
    } catch (err: any) {
      logger.error('Failed to add session', err)
      res.status(500).send({ err: 'Failed to add session' })
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const session = await SessionService.update(req.params.id, req.body)
      if (!session) return res.status(404).send({ err: 'Session not found' })
      res.json(session)
    } catch (err: any) {
      logger.error('Failed to update session', err)
      res.status(500).send({ err: 'Failed to update session' })
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      await SessionService.remove(req.params.id)
      res.send({ msg: 'Deleted successfully' })
    } catch (err: any) {
      logger.error('Failed to delete session', err)
      res.status(500).send({ err: 'Failed to delete session' })
    }
  }

  static async playWorkout(req: Request, res: Response) {
    try {
      const { workoutId, userId } = req.body

      const session = await SessionService.playWorkout(
        req.params.id,
        workoutId,
        userId
      )

      res.json(session)
    } catch (err: any) {
      logger.error('Failed to play workout', err)
      res.status(500).send({ err: 'Failed to play workout' })
    }
  }
}
