import { ExerciseModel, IExercise } from './exercise.model'
import { logger } from '../../services/logger.service'
import { Exercise } from '@/types/Exercise/Exercise'

export class ExerciseService {
  /**
   * Get exercise by ID
   */
  static async getById(exerciseId: string): Promise<IExercise | null> {
    try {
      const exercise = await ExerciseModel.findById(exerciseId)
      return exercise
    } catch (err) {
      logger.error(`Failed to get exercise ${exerciseId}`, err)
      throw err
    }
  }

  /**
   * Get exercise by exerciseId (from ExerciseDB)
   */
  static async getByExerciseId(exerciseId: string): Promise<IExercise | null> {
    try {
      const exercise = await ExerciseModel.findOne({ exerciseId })
      return exercise
    } catch (err) {
      logger.error(`Failed to get exercise by exerciseId ${exerciseId}`, err)
      throw err
    }
  }

  /**
   * Get exercises by exerciseIds (bulk)
   */
  static async getByExerciseIds(exerciseIds: string[]): Promise<IExercise[]> {
    try {
      const exercises = await ExerciseModel.find({
        exerciseId: { $in: exerciseIds },
      })
      return exercises
    } catch (err) {
      logger.error('Failed to get exercises by exerciseIds', err)
      throw err
    }
  }

  /**
   * Query exercises with filters
   */
  static async query(filterBy = {}): Promise<IExercise[]> {
    try {
      const exercises = await ExerciseModel.find(filterBy)
      return exercises
    } catch (err) {
      logger.error('Failed to query exercises', err)
      throw err
    }
  }

  /**
   * Search exercises by name (text search)
   */
  static async searchByName(params: {
    query: string
    muscleGroup?: string
    equipment?: string
  }): Promise<IExercise[]> {
    try {
      const { query, muscleGroup, equipment } = params

      const exercises = await ExerciseModel.find({
        $or: [
          { $text: { $search: query } },
          { muscleGroups: { $regex: query, $options: 'i' } },
          { equipment: { $regex: query, $options: 'i' } },
        ],
      }).sort({ popularityScore: -1 })
      return exercises
    } catch (err) {
      logger.error(`Failed to search exercises by name ${params.query}`, err)
      throw err
    }
  }

  /**
   * Search exercises by muscle groups
   */
  static async searchByMuscleGroups(
    muscleGroups: string[]
  ): Promise<IExercise[]> {
    try {
      const exercises = await ExerciseModel.find({
        muscleGroups: { $in: muscleGroups },
      })
      return exercises
    } catch (err) {
      logger.error(
        `Failed to search exercises by muscle groups ${muscleGroups}`,
        err
      )
      throw err
    }
  }

  /**
   * Search exercises by equipment
   */
  static async searchByEquipment(equipment: string[]): Promise<IExercise[]> {
    try {
      const exercises = await ExerciseModel.find({
        $or: [
          { equipment: { $in: equipment } },
          { equipments: { $in: equipment } },
        ],
      })
      return exercises
    } catch (err) {
      logger.error(`Failed to search exercises by equipment ${equipment}`, err)
      throw err
    }
  }

  /**
   * Add a single exercise
   */
  static async add(exercise: Partial<Exercise>): Promise<IExercise> {
    try {
      // Check if exercise with same exerciseId already exists
      if (exercise.exerciseId) {
        const existing = await ExerciseModel.findOne({
          exerciseId: exercise.exerciseId,
        })
        if (existing) {
          throw new Error(
            `Exercise with exerciseId ${exercise.exerciseId} already exists`
          )
        }
      }

      const addedExercise = await ExerciseModel.create(exercise)
      return addedExercise
    } catch (err: any) {
      logger.error('Failed to add exercise', err)
      throw err
    }
  }

  /**
   * Add multiple exercises (bulk insert)
   */
  static async addMany(exercises: Partial<Exercise>[]): Promise<IExercise[]> {
    try {
      // Filter out exercises that already exist
      const exerciseIds = exercises
        .map((ex) => ex.exerciseId)
        .filter(Boolean) as string[]

      if (exerciseIds.length > 0) {
        const existing = await ExerciseModel.find({
          exerciseId: { $in: exerciseIds },
        })
        const existingIds = new Set(
          existing.map((ex) => ex.exerciseId).filter(Boolean)
        )

        const newExercises = exercises.filter(
          (ex) => !existingIds.has(ex.exerciseId!)
        )

        if (newExercises.length === 0) {
          return existing
        }

        const savedExercises = await ExerciseModel.insertMany(newExercises, {
          ordered: false,
        }).catch((err: any) => {
          // If there are duplicate key errors, fetch existing ones
          if (err.code === 11000 || err.name === 'MongoServerError') {
            logger.info(`Some exercises already exist, fetching existing ones`)
            return ExerciseModel.find({
              exerciseId: { $in: exerciseIds },
            })
          }
          throw err
        })

        return [
          ...existing,
          ...(Array.isArray(savedExercises) ? savedExercises : []),
        ]
      }

      const savedExercises = await ExerciseModel.insertMany(exercises, {
        ordered: false,
      })
      return savedExercises
    } catch (err: any) {
      logger.error('Failed to add exercises', err)
      throw err
    }
  }

  /**
   * Update an exercise
   */
  static async update(
    exerciseId: string,
    exerciseToUpdate: Partial<Exercise>
  ): Promise<IExercise | null> {
    try {
      const exercise = await ExerciseModel.findByIdAndUpdate(
        exerciseId,
        exerciseToUpdate,
        {
          new: true,
        }
      )
      return exercise
    } catch (err) {
      logger.error(`Failed to update exercise ${exerciseId}`, err)
      throw err
    }
  }

  /**
   * Update an exercise by exerciseId (from ExerciseDB)
   */
  static async updateByExerciseId(
    exerciseId: string,
    exerciseToUpdate: Partial<Exercise>
  ): Promise<IExercise | null> {
    try {
      const exercise = await ExerciseModel.findOneAndUpdate(
        { exerciseId },
        exerciseToUpdate,
        {
          new: true,
        }
      )
      return exercise
    } catch (err) {
      logger.error(`Failed to update exercise by exerciseId ${exerciseId}`, err)
      throw err
    }
  }

  /**
   * Remove an exercise
   */
  static async remove(exerciseId: string): Promise<void> {
    try {
      await ExerciseModel.findByIdAndDelete(exerciseId)
    } catch (err) {
      logger.error(`Failed to remove exercise ${exerciseId}`, err)
      throw err
    }
  }

  /**
   * Remove an exercise by exerciseId (from ExerciseDB)
   */
  static async removeByExerciseId(exerciseId: string): Promise<void> {
    try {
      await ExerciseModel.findOneAndDelete({ exerciseId })
    } catch (err) {
      logger.error(`Failed to remove exercise by exerciseId ${exerciseId}`, err)
      throw err
    }
  }
}
