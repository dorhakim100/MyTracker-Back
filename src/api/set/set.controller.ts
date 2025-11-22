import { Request, Response } from 'express'
import { SetService } from './set.service'
import { logger } from '../../services/logger.service'

export class SetController {
  static async getSets(req: Request, res: Response) {
    try {
      const sets = await SetService.query(req.query)
      res.json(sets)
    } catch (err: any) {
      logger.error('Failed to get sets', err)
      res.status(500).send({ err: 'Failed to get sets' })
    }
  }

  static async getSet(req: Request, res: Response) {
    try {
      const set = await SetService.getById(req.params.id)
      if (!set) {
        return res.status(404).send({ err: 'Set not found' })
      }
      res.json(set)
    } catch (err: any) {
      logger.error('Failed to get set', err)
      res.status(500).send({ err: 'Failed to get set' })
    }
  }

  static async getSetsByWorkoutId(req: Request, res: Response) {
    try {
      const { workoutId } = req.params
      const sets = await SetService.getByWorkoutId(workoutId)
      res.json(sets)
    } catch (err: any) {
      logger.error('Failed to get sets by workoutId', err)
      res.status(500).send({ err: 'Failed to get sets by workoutId' })
    }
  }

  static async getSetsByExerciseId(req: Request, res: Response) {
    try {
      const { exerciseId } = req.params
      const sets = await SetService.getByExerciseId(exerciseId)
      res.json(sets)
    } catch (err: any) {
      logger.error('Failed to get sets by exerciseId', err)
      res.status(500).send({ err: 'Failed to get sets by exerciseId' })
    }
  }

  static async addSet(
    req: Request & { user?: { _id: string } },
    res: Response
  ) {
    try {
      const set = req.body

      logger.info('Adding set', set)

      const addedSet = await SetService.add(set)
      res.json(addedSet)
    } catch (err: any) {
      logger.error('Failed to add set', err)
      res.status(500).send({ err: 'Failed to add set' })
    }
  }

  static async updateSet(req: Request, res: Response) {
    try {
      const set = await SetService.update(req.params.id, req.body)
      if (!set) {
        return res.status(404).send({ err: 'Set not found' })
      }
      res.json(set)
    } catch (err: any) {
      logger.error('Failed to update set', err)
      res.status(500).send({ err: 'Failed to update set' })
    }
  }

  static async deleteSet(req: Request, res: Response) {
    try {
      await SetService.remove(req.params.id)
      res.send({ msg: 'Deleted successfully' })
    } catch (err: any) {
      logger.error('Failed to delete set', err)
      res.status(500).send({ err: 'Failed to delete set' })
    }
  }
}

