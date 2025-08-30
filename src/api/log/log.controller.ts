import { Request, Response } from 'express'
import { LogService } from './log.service'
import { logger } from '../../services/logger.service'

export class LogController {
  static async getLogs(req: Request, res: Response) {
    try {
      const logs = await LogService.query(req.query)
      res.json(logs)
    } catch (err: any) {
      logger.error('Failed to get logs', err)
      res.status(500).send({ err: 'Failed to get logs' })
    }
  }

  static async getLog(req: Request, res: Response) {
    try {
      const log = await LogService.getById(req.params.id)
      res.json(log)
    } catch (err: any) {
      logger.error('Failed to get log', err)
      res.status(500).send({ err: 'Failed to get log' })
    }
  }

  static async addLog(req: Request & { user?: { id: string } }, res: Response) {
    try {
      const log = req.body
      log.createdBy = req.user?.id as string
      const addedLog = await LogService.add(log)
      res.json(addedLog)
    } catch (err: any) {
      logger.error('Failed to add log', err)
      res.status(500).send({ err: 'Failed to add log' })
    }
  }

  static async updateLog(req: Request, res: Response) {
    try {
      const log = await LogService.update(req.params.id, req.body)
      res.json(log)
    } catch (err: any) {
      logger.error('Failed to update log', err)
      res.status(500).send({ err: 'Failed to update log' })
    }
  }

  static async deleteLog(req: Request, res: Response) {
    try {
      await LogService.remove(req.params.id)
      res.send({ msg: 'Deleted successfully' })
    } catch (err: any) {
      logger.error('Failed to delete log', err)
      res.status(500).send({ err: 'Failed to delete log' })
    }
  }
}
