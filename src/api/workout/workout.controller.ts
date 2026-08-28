import { Request, Response } from 'express'
import { WorkoutService } from './workout.service'
import { logger } from '../../services/logger.service'

export class WorkoutController {
  static async getWorkouts(req: Request, res: Response) {
    try {
      const forUserId = (req.query.forUserId as string) || ''
      const from = req.query.from as string | undefined
      const to = req.query.to as string | undefined
      const limit = req.query.limit ? Number(req.query.limit) : undefined
      const isAll = req.query.all === 'true'

      const filter: {
        forUserId: string
        from?: string
        to?: string
        limit?: number
      } = { forUserId }

      if (!isAll) {
        if (limit && !Number.isNaN(limit)) {
          filter.limit = limit
        } else if (from || to) {
          if (from) filter.from = from
          if (to) filter.to = to
        } else {
          filter.limit = 6
        }
      }

      const workouts = await WorkoutService.query(filter)
      res.json(workouts)
    } catch (err: any) {
      logger.error('Failed to get workouts', err)
      res.status(500).send({ err: 'Failed to get workouts' })
    }
  }

  static async getWorkout(req: Request, res: Response) {
    try {
      const workout = await WorkoutService.getById(req.params.id)
      res.json(workout)
    } catch (err: any) {
      logger.error('Failed to get workout', err)
      res.status(500).send({ err: 'Failed to get workout' })
    }
  }

  static async addWorkout(
    req: Request & { user?: { _id: string } },
    res: Response
  ) {
    try {
      const workout = req.body

      // workout.createdBy = req.user?._id as string
      const addedWorkout = await WorkoutService.add(workout)
      res.json(addedWorkout)
    } catch (err: any) {
      logger.error('Failed to add workout', err)
      res.status(500).send({ err: 'Failed to add workout' })
    }
  }

  static async updateWorkout(req: Request, res: Response) {
    try {
      const workout = await WorkoutService.update(req.params.id, req.body)

      res.json(workout)
    } catch (err: any) {
      logger.error('Failed to update workout', err)
      res.status(500).send({ err: 'Failed to update workout' })
    }
  }

  static async deleteWorkout(req: Request, res: Response) {
    try {
      await WorkoutService.remove(req.params.id)
      res.send({ msg: 'Deleted successfully' })
    } catch (err: any) {
      logger.error('Failed to delete workout', err)
      res.status(500).send({ err: 'Failed to delete workout' })
    }
  }
}
