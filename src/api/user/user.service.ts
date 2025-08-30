import { User, IUser } from './user.model'
import { logger } from '../../services/logger.service'
import { Goal } from '@/types/Goal/Goal'
import mongoose from 'mongoose'
import { LoggedToday } from '@/types/LoggedToday/LoggedToday'
import { DayService } from '../day/day.service'

export class UserService {
  static async query(filterBy = {}) {
    try {
      const users = await User.find(filterBy).select('-password')
      return users
    } catch (err) {
      logger.error('Failed to query users', err)
      throw err
    }
  }

  static async getById(userId: string) {
    try {
      const [user] = await User.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(userId) } },
        { $project: { password: 0 } },
        {
          $addFields: {
            loggedTodayObjectId: {
              $cond: [
                { $eq: [{ $type: '$loggedToday' }, 'string'] },
                { $toObjectId: '$loggedToday' },
                {
                  $cond: [
                    { $eq: [{ $type: '$loggedToday' }, 'objectId'] },
                    '$loggedToday',
                    null,
                  ],
                },
              ],
            },
          },
        },
        {
          $lookup: {
            from: 'days',
            let: { dayId: '$loggedTodayObjectId' },
            pipeline: [
              { $match: { $expr: { $eq: ['$_id', '$$dayId'] } } },
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
            ],
            as: 'loggedTodayPopulated',
          },
        },
        {
          $addFields: {
            loggedToday: { $arrayElemAt: ['$loggedTodayPopulated', 0] },
          },
        },
        { $project: { loggedTodayPopulated: 0, loggedTodayObjectId: 0 } },
      ])

      return user || null
    } catch (err) {
      logger.error(`Failed to get user ${userId}`, err)
      throw err
    }
  }

  static async getByEmail(email: string) {
    try {
      const user = await User.findOne({ email })
      return user
    } catch (err) {
      logger.error(`Failed to get user by email ${email}`, err)
      throw err
    }
  }

  static async remove(userId: string) {
    try {
      await User.findByIdAndDelete(userId)
    } catch (err) {
      logger.error(`Failed to remove user ${userId}`, err)
      throw err
    }
  }

  static async update(userId: string, userToUpdate: Partial<IUser>) {
    try {
      // const logsToUpdate = userToUpdate.loggedToday?.logs.map(
      //   (log: any) => log._id
      // )

      // const userToSave = {
      //   ...userToUpdate,
      //   loggedToday: { ...userToUpdate.loggedToday, logs: logsToUpdate },
      // }

      const user = await User.findByIdAndUpdate(userId, userToUpdate, {
        new: true,
      })

      // if (user && userToUpdate.loggedToday) {
      //   const { date, calories } = userToUpdate.loggedToday as LoggedToday
      //   await DayService.upsertFromLoggedToday({
      //     userId,
      //     date,
      //     logs: logsToUpdate || [],
      //     calories: calories || 0,
      //   })
      // }
      return user
    } catch (err) {
      logger.error(`Failed to update user ${userId}`, err)
      throw err
    }
  }

  static getDefaultGoal(): Goal {
    const id = new mongoose.Types.ObjectId().toString()
    return {
      _id: id,
      isMain: true,
      updatedAt: new Date(),
      title: 'My Goal',
      dailyCalories: 2400,
      macros: {
        calories: 2400,
        protein: 180,
        carbs: 300,
        fat: 53,
      },
    }
  }
}
