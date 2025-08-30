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
      const user = await User.findById(userId).select('-password')
      return user
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
      const user = await User.findByIdAndUpdate(userId, userToUpdate, {
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
