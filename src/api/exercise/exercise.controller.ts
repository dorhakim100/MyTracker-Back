import { Request, Response } from 'express'
import { ExerciseService } from './exercise.service'
import { logger } from '../../services/logger.service'

export class ExerciseController {
  /**
   * Get exercise by ID
   */
  static async getExercise(req: Request, res: Response) {
    try {
      const exercise = await ExerciseService.getById(req.params.id)
      if (!exercise) {
        return res.status(404).send({ err: 'Exercise not found' })
      }
      res.json(exercise)
    } catch (err: any) {
      logger.error('Failed to get exercise', err)
      res.status(500).send({ err: 'Failed to get exercise' })
    }
  }

  /**
   * Get exercise by exerciseId (from ExerciseDB)
   */
  static async getExerciseByExerciseId(req: Request, res: Response) {
    try {
      const { exerciseId } = req.query

      if (!exerciseId || typeof exerciseId !== 'string') {
        return res.status(400).send({ err: 'ExerciseId is required' })
      }

      const exercise = await ExerciseService.getByExerciseId(exerciseId)
      if (!exercise) {
        return res.status(404).send({ err: 'Exercise not found' })
      }
      res.json(exercise)
    } catch (err: any) {
      logger.error('Failed to get exercise by exerciseId', err)
      res.status(500).send({ err: 'Failed to get exercise by exerciseId' })
    }
  }

  /**
   * Get exercises by exerciseIds (bulk)
   */
  static async getExercisesByExerciseIds(req: Request, res: Response) {
    try {
      const { exerciseIds } = req.query as { exerciseIds: string[] }

      if (!exerciseIds || !Array.isArray(exerciseIds)) {
        return res.status(400).send({ err: 'ExerciseIds array is required' })
      }

      const exercises = await ExerciseService.getByExerciseIds(exerciseIds)
      res.json(exercises)
    } catch (err: any) {
      logger.error('Failed to get exercises by exerciseIds', err)
      res.status(500).send({ err: 'Failed to get exercises by exerciseIds' })
    }
  }

  /**
   * Query exercises with filters
   */
  static async getExercises(req: Request, res: Response) {
    try {
      const exercises = await ExerciseService.query(req.query)
      res.json(exercises)
    } catch (err: any) {
      logger.error('Failed to get exercises', err)
      res.status(500).send({ err: 'Failed to get exercises' })
    }
  }

  /**
   * Search exercises by name
   */
  static async searchExercises(
    req: Request & {
      query: { q: string; muscleGroup?: string; equipment?: string }
    },
    res: Response
  ) {
    try {
      const { q, muscleGroup, equipment } = req.query
      if (!q || typeof q !== 'string') {
        return res.status(400).send({ err: 'Query parameter is required' })
      }

      const exercises = await ExerciseService.searchByName({
        query: q,
        muscleGroup,
        equipment,
      })
      res.json(exercises)
    } catch (err: any) {
      logger.error('Failed to search exercises', err)
      res.status(500).send({ err: 'Failed to search exercises' })
    }
  }

  /**
   * Search exercises by muscle groups
   */
  static async searchExercisesByMuscleGroups(req: Request, res: Response) {
    try {
      const { muscleGroups } = req.query

      if (!muscleGroups) {
        return res.status(400).send({ err: 'Muscle groups are required' })
      }

      const muscleGroupsArray = Array.isArray(muscleGroups)
        ? (muscleGroups as string[])
        : [muscleGroups as string]

      const exercises = await ExerciseService.searchByMuscleGroups(
        muscleGroupsArray
      )
      res.json(exercises)
    } catch (err: any) {
      logger.error('Failed to search exercises by muscle groups', err)
      res.status(500).send({
        err: 'Failed to search exercises by muscle groups',
      })
    }
  }

  /**
   * Search exercises by equipment
   */
  static async searchExercisesByEquipment(req: Request, res: Response) {
    try {
      const { equipment } = req.query

      if (!equipment) {
        return res.status(400).send({ err: 'Equipment is required' })
      }

      const equipmentArray = Array.isArray(equipment)
        ? (equipment as string[])
        : [equipment as string]

      const exercises = await ExerciseService.searchByEquipment(equipmentArray)
      res.json(exercises)
    } catch (err: any) {
      logger.error('Failed to search exercises by equipment', err)
      res.status(500).send({ err: 'Failed to search exercises by equipment' })
    }
  }

  /**
   * Add a single exercise
   */
  static async addExercise(req: Request, res: Response) {
    try {
      const exercise = req.body
      delete exercise._id
      const addedExercise = await ExerciseService.add(exercise)
      res.json(addedExercise)
    } catch (err: any) {
      logger.error('Failed to add exercise', err)
      if (err.message?.includes('already exists')) {
        return res.status(409).send({ err: err.message })
      }
      res.status(500).send({ err: 'Failed to add exercise' })
    }
  }

  /**
   * Add multiple exercises (bulk)
   */
  static async addExercises(req: Request, res: Response) {
    try {
      const { exercises } = req.body
      console.log(`Got ${exercises.length} exercises to add`)

      if (!exercises || !Array.isArray(exercises)) {
        return res.status(400).send({ err: 'Exercises array is required' })
      }

      const addedExercises = await ExerciseService.addMany(exercises)
      console.log(`Added ${addedExercises.length} exercises`)
      res.json(addedExercises)
    } catch (err: any) {
      logger.error('Failed to add exercises', err)
      res.status(500).send({ err: 'Failed to add exercises' })
    }
  }

  /**
   * Update an exercise
   */
  static async updateExercise(req: Request, res: Response) {
    try {
      const exercise = await ExerciseService.update(req.params.id, req.body)
      if (!exercise) {
        return res.status(404).send({ err: 'Exercise not found' })
      }
      res.json(exercise)
    } catch (err: any) {
      logger.error('Failed to update exercise', err)
      res.status(500).send({ err: 'Failed to update exercise' })
    }
  }

  /**
   * Update an exercise by exerciseId
   */
  static async updateExerciseByExerciseId(req: Request, res: Response) {
    try {
      const { exerciseId } = req.query

      if (!exerciseId || typeof exerciseId !== 'string') {
        return res.status(400).send({ err: 'ExerciseId is required' })
      }

      const exercise = await ExerciseService.updateByExerciseId(
        exerciseId,
        req.body
      )
      if (!exercise) {
        return res.status(404).send({ err: 'Exercise not found' })
      }
      res.json(exercise)
    } catch (err: any) {
      logger.error('Failed to update exercise by exerciseId', err)
      res.status(500).send({ err: 'Failed to update exercise by exerciseId' })
    }
  }

  /**
   * Delete an exercise
   */
  static async deleteExercise(req: Request, res: Response) {
    try {
      await ExerciseService.remove(req.params.id)
      res.send({ msg: 'Deleted successfully' })
    } catch (err: any) {
      logger.error('Failed to delete exercise', err)
      res.status(500).send({ err: 'Failed to delete exercise' })
    }
  }

  /**
   * Delete an exercise by exerciseId
   */
  static async deleteExerciseByExerciseId(req: Request, res: Response) {
    try {
      const { exerciseId } = req.query

      if (!exerciseId || typeof exerciseId !== 'string') {
        return res.status(400).send({ err: 'ExerciseId is required' })
      }

      await ExerciseService.removeByExerciseId(exerciseId)
      res.send({ msg: 'Deleted successfully' })
    } catch (err: any) {
      logger.error('Failed to delete exercise by exerciseId', err)
      res.status(500).send({ err: 'Failed to delete exercise by exerciseId' })
    }
  }
}
