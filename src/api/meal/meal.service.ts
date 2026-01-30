import { Meal, IMeal } from './meal.model'
import { logger } from '../../services/logger.service'

export class MealService {
  static async query(filterBy = {}) {
    try {
      const meals = await Meal.find(filterBy).populate(
        'createdBy',
        'name email'
      )
      return meals
    } catch (err) {
      logger.error('Failed to query meals', err)
      throw err
    }
  }
  static async getByMealIds(mealIds: string[]) {
    try {
      const meals = await Meal.find({ _id: { $in: mealIds } })
      return meals
    } catch (err) {
      logger.error('Failed to get meals by meal ids', err)
      throw err
    }
  }

  static async getById(logId: string) {
    try {
      const meal = await Meal.findById(logId).populate(
        'createdBy',
        'name email'
      )
      return meal
    } catch (err) {
      logger.error(`Failed to get log ${logId}`, err)
      throw err
    }
  }

  static async add(log: Partial<IMeal>) {
    try {
      const addedLog = await Meal.create(log)
      return addedLog
    } catch (err) {
      logger.error('Failed to add meal', err)
      throw err
    }
  }

  static async update(logId: string, logToUpdate: Partial<IMeal>) {
    try {
      const log = await Meal.findByIdAndUpdate(logId, logToUpdate, {
        new: true,
      })
      return log
    } catch (err) {
      logger.error(`Failed to update log ${logId}`, err)
      throw err
    }
  }

  static async remove(logId: string) {
    try {
      await Meal.findByIdAndDelete(logId)
    } catch (err) {
      logger.error(`Failed to remove log ${logId}`, err)
      throw err
    }
  }
}
