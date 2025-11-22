import { Set, ISet } from './set.model'
import { logger } from '../../services/logger.service'

export class SetService {
  static async query(filterBy = {}) {
    try {
      const sets = await Set.find(filterBy)
      return sets
    } catch (err) {
      logger.error('Failed to query sets', err)
      throw err
    }
  }

  static async getById(setId: string) {
    try {
      const set = await Set.findById(setId)
      return set
    } catch (err) {
      logger.error(`Failed to get set ${setId}`, err)
      throw err
    }
  }

  static async getByWorkoutId(workoutId: string) {
    try {
      const sets = await Set.find({ workoutId })
      return sets
    } catch (err) {
      logger.error(`Failed to get sets by workoutId ${workoutId}`, err)
      throw err
    }
  }

  static async getByExerciseId(exerciseId: string) {
    try {
      const sets = await Set.find({ exerciseId })
      return sets
    } catch (err) {
      logger.error(`Failed to get sets by exerciseId ${exerciseId}`, err)
      throw err
    }
  }

  static async add(set: Partial<ISet>) {
    try {
      const addedSet = await Set.create(set)
      return addedSet
    } catch (err) {
      logger.error('Failed to add set', err)
      throw err
    }
  }

  static async update(setId: string, setToUpdate: Partial<ISet>) {
    try {
      const set = await Set.findByIdAndUpdate(setId, setToUpdate, {
        new: true,
      })
      return set
    } catch (err) {
      logger.error(`Failed to update set ${setId}`, err)
      throw err
    }
  }

  static async remove(setId: string) {
    try {
      await Set.findByIdAndDelete(setId)
    } catch (err) {
      logger.error(`Failed to remove set ${setId}`, err)
      throw err
    }
  }
}
