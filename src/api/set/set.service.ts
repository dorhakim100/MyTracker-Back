import { Set, ISet } from './set.model'
import { logger } from '../../services/logger.service'
import mongoose from 'mongoose'

export class SetService {
  /**
   * Ensures RPE and RIR are mutually exclusive.
   * If RIR has an actual value, RPE should be undefined.
   * If RPE has an actual value, RIR should be undefined.
   */
  private static sanitizeRpeRir(set: Partial<ISet>): Partial<ISet> {
    const sanitized: any = { ...set }

    // Check if RIR has an actual value (not null/undefined)
    const hasRir = sanitized.rir?.actual != null

    // Check if RPE has an actual value (not null/undefined)
    const hasRpe = sanitized.rpe?.actual != null

    if (hasRir) {
      // If RIR exists, remove RPE (set to undefined so it's not included)
      sanitized.rpe = undefined
    } else if (hasRpe) {
      // If RPE exists, remove RIR (set to undefined so it's not included)
      sanitized.rir = undefined
    } else {
      // If neither has actual value, remove both
      sanitized.rpe = undefined
      sanitized.rir = undefined
    }

    // Remove undefined fields to ensure they're not saved
    Object.keys(sanitized).forEach((key) => {
      if (sanitized[key] === undefined) {
        delete sanitized[key]
      }
    })

    return sanitized
  }
  static async query(filterBy = {}) {
    try {
      const sets = await Set.find({ ...filterBy, isDone: true }).sort({
        setNumber: 1,
      })
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

  static async getBySessionId(sessionId: string) {
    try {
      const sets = await Set.find({ sessionId }).sort({
        exerciseId: 1,
        setNumber: 1,
      })
      return sets
    } catch (err) {
      logger.error(`Failed to get sets by session id ${sessionId}`, err)
      throw err
    }
  }

  static async getBySessionIdAndExerciseId(
    sessionId: string,
    exerciseId: string
  ) {
    try {
      const sets = await Set.find({ sessionId, exerciseId }).sort({
        setNumber: 1,
      })
      return sets
    } catch (err) {
      logger.error(
        `Failed to get sets by session id ${sessionId} and exercise id ${exerciseId}`,
        err
      )
      throw err
    }
  }

  static async add(set: Partial<ISet>) {
    try {
      const sanitizedSet = this.sanitizeRpeRir(set)
      const addedSet = await Set.create(sanitizedSet)
      return addedSet
    } catch (err) {
      logger.error('Failed to add set', err)
      throw err
    }
  }
  static async bulkSave(sets: Partial<ISet>[]) {
    try {
      const sanitizedSets = sets.map((set) => this.sanitizeRpeRir(set))
      console.log('sanitizedSets', sanitizedSets)

      const savedSets = await Set.insertMany(sanitizedSets)
      return savedSets
    } catch (err) {
      logger.error('Failed to bulk save sets', err)
      throw err
    }
  }

  static async update(setId: string, setToUpdate: Partial<ISet>) {
    try {
      const sanitizedSet = this.sanitizeRpeRir(setToUpdate)

      // Build update object with $unset for fields that need to be removed
      const update: any = { ...sanitizedSet }
      const unset: any = {}

      // If RPE/RIR were in the update but removed by sanitization, unset them
      if (
        !('rpe' in sanitizedSet) &&
        ('rpe' in setToUpdate || 'rir' in setToUpdate)
      ) {
        unset.rpe = ''
      }
      if (
        !('rir' in sanitizedSet) &&
        ('rpe' in setToUpdate || 'rir' in setToUpdate)
      ) {
        unset.rir = ''
      }

      if (Object.keys(unset).length > 0) {
        update.$unset = unset
      }

      const set = await Set.findByIdAndUpdate(setId, update, {
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

  static async removeBySessionId(sessionId: string) {
    try {
      await Set.deleteMany({ sessionId })
    } catch (err) {
      logger.error(`Failed to remove sets by session id ${sessionId}`, err)
      throw err
    }
  }

  static async removeBySessionIdAndExerciseId(
    sessionId: string,
    exerciseId: string
  ) {
    try {
      await Set.deleteMany({ sessionId, exerciseId })
    } catch (err) {
      logger.error(
        `Failed to remove sets by session id ${sessionId} and exercise id ${exerciseId}`,
        err
      )
      throw err
    }
  }

  static async addSets(sets: Omit<ISet, keyof mongoose.Document>[]) {
    try {
      const sanitizedSets = sets.map((set) => this.sanitizeRpeRir(set))
      await Set.insertMany(sanitizedSets)
    } catch (err) {
      logger.error(`Failed to add sets`, err)
      throw err
    }
  }

  static async saveBySessionIdAndExerciseIdAndSetIndex(
    sessionId: string,
    exerciseId: string,
    setIndex: number,
    set: Partial<ISet>
  ) {
    try {
      const sanitizedSet = this.sanitizeRpeRir(set)

      // Build update object with $unset for fields that need to be removed
      const update: any = { ...sanitizedSet }
      const unset: any = {}

      // If RPE/RIR were in the update but removed by sanitization, unset them
      if (!('rpe' in sanitizedSet) && ('rpe' in set || 'rir' in set)) {
        unset.rpe = ''
      }
      if (!('rir' in sanitizedSet) && ('rpe' in set || 'rir' in set)) {
        unset.rir = ''
      }

      if (Object.keys(unset).length > 0) {
        update.$unset = unset
      }

      const savedSet = await Set.findOneAndUpdate(
        { sessionId, exerciseId, setNumber: setIndex + 1 },
        update,
        { new: true }
      )
      return savedSet
    } catch (err) {
      logger.error(
        `Failed to save set by session id and exercise id and set index`,
        err
      )
      throw err
    }
  }

  static async addBySessionIdAndExerciseIdAndSetIndex(
    sessionId: string,
    exerciseId: string,
    setIndex: number,
    set: Partial<ISet>
  ) {
    try {
      const sanitizedSet = this.sanitizeRpeRir(set)
      const addedSet = await Set.create({
        ...sanitizedSet,
        sessionId,
        exerciseId,
        setNumber: setIndex + 1,
      })
      return addedSet
    } catch (err) {
      logger.error(
        `Failed to add set by session id and exercise id and set index`,
        err
      )
      throw err
    }
  }

  static async removeBySessionIdAndExerciseIdAndSetIndex(
    sessionId: string,
    exerciseId: string,
    setIndex: number
  ) {
    try {
      await Set.deleteOne({ sessionId, exerciseId, setNumber: setIndex + 1 })
    } catch (err) {
      logger.error(
        `Failed to remove set by session id and exercise id and set index`,
        err
      )
      throw err
    }
  }
}
