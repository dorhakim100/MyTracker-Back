import { Set, ISet } from './set.model'
import { logger } from '../../services/logger.service'
import mongoose from 'mongoose'

export class SetService {
  static async query(filterBy = {}) {
    try {
      const sets = await Set.find(filterBy).sort({ setNumber: 1 })
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
      await Set.insertMany(sets)
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
      const savedSet = await Set.findOneAndUpdate(
        { sessionId, exerciseId, setNumber: setIndex + 1 },
        set,
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
      const addedSet = await Set.create({
        ...set,
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
