import { Day, IDay } from './day.model'
import mongoose from 'mongoose'
import { logger } from '../../services/logger.service'
import { LoggedToday } from '@/types/LoggedToday/LoggedToday'
import { getDateFromISO } from '../../services/utils'

export class DayService {
  static async upsertFromLoggedToday(params: {
    userId: string
    date: string
    logs: Array<string | mongoose.Types.ObjectId | { _id: string }>
    calories: number
  }): Promise<IDay> {
    try {
      const { userId, date, logs, calories } = params
      const logIdsAsStrings = (logs || [])
        .map((id: any) => {
          if (!id) return null
          if (typeof id === 'string') return id
          if (id instanceof mongoose.Types.ObjectId) return id.toString()
          if (typeof id === 'object' && id._id) return String(id._id)
          return null
        })
        .filter(Boolean) as string[]

      const day = await Day.findOneAndUpdate(
        { userId, date },
        { $set: { logs: logIdsAsStrings, calories } },
        { new: true, upsert: true }
      )
      return day
    } catch (err) {
      logger.error('DayService.upsertFromLoggedToday failed', err)
      throw err
    }
  }

  static async getById(dayId: string): Promise<IDay | null> {
    try {
      //   return await Day.findById(dayId)
      const day = await Day.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(dayId) } },

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
      logger.error(`DayService.getById failed for ${dayId}`, err)
      throw err
    }
  }

  static async getByUserAndDate(
    userId: string,
    date: string
  ): Promise<IDay | null> {
    try {
      const dateFromISO = getDateFromISO(date)

      const isExistingDay = await Day.findOne({ userId, date: dateFromISO })
      if (!isExistingDay) {
        await Day.create({ userId, date: dateFromISO })
      }

      const [day] = await Day.aggregate([
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
      logger.error(
        `DayService.getByUserAndDate failed for user ${userId} date ${date}`,
        err
      )
      throw err
    }
  }

  static async listByUser(userId: string, limit = 30): Promise<IDay[]> {
    try {
      const days = await Day.aggregate([
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
      logger.error(`DayService.listByUser failed for ${userId}`, err)
      throw err
    }
  }

  static getDefaultLoggedToday() {
    return {
      _id: new mongoose.Types.ObjectId().toString() as string,
      date: getDateFromISO(new Date().toISOString()),
      logs: [],
      calories: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }

  static async add(day: IDay, userId: string) {
    try {
      const addedDay = await Day.create({ ...day, userId })
      return addedDay
    } catch (err) {
      logger.error('DayService.add failed', err)
      throw err
    }
  }

  static async update(day: Partial<IDay>, userId?: string) {
    try {
      const dayId = day._id

      let dayToUpdate

      if (userId) {
        dayToUpdate = { ...day, userId }
      } else {
        dayToUpdate = day
      }

      const updatedDay = await Day.findByIdAndUpdate(
        dayId,
        { ...dayToUpdate },
        { new: true }
      )
      return updatedDay
    } catch (err) {
      logger.error('DayService.update failed', err)
      throw err
    }
  }
}
