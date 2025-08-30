import { User, IUser } from './user.model'
import { logger } from '../../services/logger.service'
import { Goal } from '@/types/Goal/Goal'
import mongoose from 'mongoose'
import { LoggedToday } from '@/types/LoggedToday/LoggedToday'

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
            loggedTodayLogIds: {
              $map: {
                input: { $ifNull: ['$loggedToday.logs', []] },
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
            loggedTodayLogIds: {
              $filter: {
                input: '$loggedTodayLogIds',
                as: 'id',
                cond: { $ne: ['$$id', null] },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'logs',
            localField: 'loggedTodayLogIds',
            foreignField: '_id',
            as: 'loggedTodayPopulated',
          },
        },
        { $addFields: { 'loggedToday.logs': '$loggedTodayPopulated' } },
        { $project: { loggedTodayLogIds: 0, loggedTodayPopulated: 0 } },
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
      const logsToUpdate = userToUpdate.loggedToday?.logs.map(
        (log: any) => log._id
      )

      const userToSave = {
        ...userToUpdate,
        loggedToday: { ...userToUpdate.loggedToday, logs: logsToUpdate },
      }

      const user = await User.findByIdAndUpdate(userId, userToSave, {
        new: true,
      })
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

  static getLoggedToday(): LoggedToday {
    return {
      _id: new mongoose.Types.ObjectId().toString(),
      date: new Date().toISOString(),
      logs: [],
      calories: 0,
    }
  }
}
