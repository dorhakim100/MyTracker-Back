'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.DayService = void 0
const day_model_1 = require('./day.model')
const mongoose_1 = __importDefault(require('mongoose'))
const logger_service_1 = require('../../services/logger.service')
const utils_1 = require('../../services/utils')
class DayService {
  static async upsertFromLoggedToday(params) {
    try {
      const { userId, date, logs, calories } = params
      const logIdsAsStrings = (logs || [])
        .map((id) => {
          if (!id) return null
          if (typeof id === 'string') return id
          if (id instanceof mongoose_1.default.Types.ObjectId)
            return id.toString()
          if (typeof id === 'object' && id._id) return String(id._id)
          return null
        })
        .filter(Boolean)
      const day = await day_model_1.Day.findOneAndUpdate(
        { userId, date },
        { $set: { logs: logIdsAsStrings, calories } },
        { new: true, upsert: true }
      )
      return day
    } catch (err) {
      logger_service_1.logger.error(
        'DayService.upsertFromLoggedToday failed',
        err
      )
      throw err
    }
  }
  static async getById(dayId) {
    try {
      //   return await Day.findById(dayId)
      const day = await day_model_1.Day.aggregate([
        { $match: { _id: new mongoose_1.default.Types.ObjectId(dayId) } },
        {
          $addFields: {
            logsIds: {
              $map: {
                input: { $ifNull: ['$logs', []] },
                as: 'id',
                in: {
                  $cond: [
                    { $eq: [{ $type: '$$id' }, 'objectId'] },
                    '$$id',
                    {
                      $cond: [
                        { $eq: [{ $type: '$$id' }, 'string'] },
                        { $toObjectId: '$$id' },
                        {
                          $cond: [
                            { $eq: [{ $type: '$$id' }, 'object'] },
                            { $toObjectId: '$$id._id' },
                            null,
                          ],
                        },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            logsIds: {
              $filter: {
                input: '$logsIds',
                as: 'id',
                cond: { $ne: ['$$id', null] },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'logs',
            localField: 'logsIds',
            foreignField: '_id',
            as: 'logs',
          },
        },
        { $addFields: { logs: '$logs' } },
        { $project: { logsIds: 0 } },
      ])
      return day[0]
    } catch (err) {
      logger_service_1.logger.error(
        `DayService.getById failed for ${dayId}`,
        err
      )
      throw err
    }
  }
  static async getByUserAndDate(userId, date) {
    try {
      const dateFromISO = (0, utils_1.getDateFromISO)(date)

      const isExistingDay = await day_model_1.Day.findOne({
        userId,
        date: dateFromISO,
      })
      if (!isExistingDay) {
        await day_model_1.Day.create({ userId, date: dateFromISO })
      }
      const [day] = await day_model_1.Day.aggregate([
        { $match: { userId, date: dateFromISO } },
        {
          $addFields: {
            logObjectIds: {
              $map: {
                input: { $ifNull: ['$logs', []] },
                as: 'id',
                in: {
                  $cond: [
                    { $eq: [{ $type: '$$id' }, 'string'] },
                    { $toObjectId: '$$id' },
                    null,
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            logObjectIds: {
              $filter: {
                input: '$logObjectIds',
                as: 'id',
                cond: { $ne: ['$$id', null] },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'logs',
            localField: 'logObjectIds',
            foreignField: '_id',
            as: 'logs',
          },
        },
        { $project: { logObjectIds: 0 } },
      ])

      return day || null
    } catch (err) {
      logger_service_1.logger.error(
        `DayService.getByUserAndDate failed for user ${userId} date ${date}`,
        err
      )
      throw err
    }
  }
  static async listByUser(userId, limit = 30) {
    try {
      const days = await day_model_1.Day.aggregate([
        { $match: { userId } },
        { $sort: { date: -1 } },
        { $limit: limit },
        {
          $addFields: {
            logObjectIds: {
              $map: {
                input: { $ifNull: ['$logs', []] },
                as: 'id',
                in: {
                  $cond: [
                    { $eq: [{ $type: '$$id' }, 'string'] },
                    { $toObjectId: '$$id' },
                    null,
                  ],
                },
              },
            },
          },
        },
        {
          $addFields: {
            logObjectIds: {
              $filter: {
                input: '$logObjectIds',
                as: 'id',
                cond: { $ne: ['$$id', null] },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'logs',
            localField: 'logObjectIds',
            foreignField: '_id',
            as: 'logs',
          },
        },
        { $project: { logObjectIds: 0 } },
      ])
      return days
    } catch (err) {
      logger_service_1.logger.error(
        `DayService.listByUser failed for ${userId}`,
        err
      )
      throw err
    }
  }
  static getDefaultLoggedToday() {
    return {
      _id: new mongoose_1.default.Types.ObjectId().toString(),
      date: (0, utils_1.getDateFromISO)(new Date().toISOString()),
      logs: [],
      calories: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }
  static async add(day, userId) {
    try {
      const addedDay = await day_model_1.Day.create({ ...day, userId })
      return addedDay
    } catch (err) {
      logger_service_1.logger.error('DayService.add failed', err)
      throw err
    }
  }
  static async update(day, userId) {
    try {
      const dayId = day._id
      let dayToUpdate
      if (userId) {
        dayToUpdate = { ...day, userId }
      } else {
        dayToUpdate = day
      }
      const updatedDay = await day_model_1.Day.findByIdAndUpdate(
        dayId,
        { ...dayToUpdate },
        { new: true }
      )
      return updatedDay
    } catch (err) {
      logger_service_1.logger.error('DayService.update failed', err)
      throw err
    }
  }
}
exports.DayService = DayService
