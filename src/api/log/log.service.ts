import { Log, ILog } from './log.model'
import { logger } from '../../services/logger.service'
import { makeId } from '../../services/utils'

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
      console.log('log', log)

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
}
