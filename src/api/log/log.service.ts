import mongoose from 'mongoose'
import { Log, ILog } from './log.model'
import { Day } from '../day/day.model'
import { DayService } from '../day/day.service'
import { logger } from '../../services/logger.service'
import { getDateFromISO } from '../../services/utils'

export class LogService {
  static async query(filterBy = {}) {
    try {
      const logs = await Log.find(filterBy).populate('createdBy', 'name email')
      return logs
    } catch (err) {
      logger.error('Failed to query logs', err)
      throw err
    }
  }

  static async getById(logId: string) {
    try {
      const log = await Log.findById(logId).populate('createdBy', 'name email')
      return log
    } catch (err) {
      logger.error(`Failed to get log ${logId}`, err)
      throw err
    }
  }

  static async add(log: Partial<ILog>) {
    try {
      if (log.itemId === '') log.itemId = `custom-log`

      const addedLog = await Log.create(log)
      return addedLog
    } catch (err) {
      logger.error('Failed to add log', err)
      throw err
    }
  }

  static async update(logId: string, logToUpdate: Partial<ILog>) {
    try {
      const log = await Log.findByIdAndUpdate(logId, logToUpdate, {
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
      await Log.findByIdAndDelete(logId)
    } catch (err) {
      logger.error(`Failed to remove log ${logId}`, err)
      throw err
    }
  }

  static async removeAllByUserId(userId: string) {
    try {
      await Log.deleteMany({ createdBy: userId })
    } catch (err) {
      logger.error(`Failed to remove all logs by user ${userId}`, err)
      throw err
    }
  }

  static async clearMeal(params: {
    userId: string
    meal: string
    date: string
  }) {
    try {
      const { userId, meal, date } = params
      const dateFromISO = getDateFromISO(date)
      const day = await Day.findOne({ userId, date: dateFromISO })

      if (!day) {
        return {
          userId,
          date: dateFromISO,
          logs: [],
          calories: 0,
        }
      }

      const logObjectIds = (day.logs || [])
        .map((id: any) => {
          if (!id) return null
          if (id instanceof mongoose.Types.ObjectId) return id
          const idStr =
            typeof id === 'string' ? id : id._id ? String(id._id) : String(id)
          if (!mongoose.Types.ObjectId.isValid(idStr)) return null
          return new mongoose.Types.ObjectId(idStr)
        })
        .filter(Boolean) as mongoose.Types.ObjectId[]

      const dayLogs = await Log.find({ _id: { $in: logObjectIds } })
      const mealKey = meal.toLowerCase()
      const logsToRemove = dayLogs.filter(
        (log) => (log.meal || '').toLowerCase() === mealKey
      )
      const remainingLogs = dayLogs.filter(
        (log) => (log.meal || '').toLowerCase() !== mealKey
      )

      if (logsToRemove.length) {
        await Log.deleteMany({
          _id: { $in: logsToRemove.map((log) => log._id) },
        })
      }

      const remainingIds = remainingLogs.map((log: ILog) => log._id?.toString())
      const calories = remainingLogs.reduce(
        (acc, log) => acc + (log.macros?.calories || 0),
        0
      )

      await Day.findByIdAndUpdate(
        day._id,
        { logs: remainingIds, calories },
        { new: true }
      )

      return DayService.getById((day._id as mongoose.Types.ObjectId).toString())
    } catch (err) {
      logger.error(
        `Failed to clear meal ${params.meal} for user ${params.userId} on ${params.date}`,
        err
      )
      throw err
    }
  }
}
