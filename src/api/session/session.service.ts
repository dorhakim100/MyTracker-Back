import { Session, ISession } from './session.model'
import mongoose from 'mongoose'
import { logger } from '../../services/logger.service'
import { getDateFromISO } from '../../services/utils'

export class SessionService {
  static async getById(sessionId: string): Promise<ISession | null> {
    try {
      const session = await Session.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(sessionId) } },
        {
          $addFields: {
            workoutObjectId: {
              $cond: [
                { $eq: [{ $type: '$workoutId' }, 'string'] },
                { $toObjectId: '$workoutId' },
                '$workoutId',
              ],
            },
          },
        },
        {
          $lookup: {
            from: 'workouts',
            localField: 'workoutObjectId',
            foreignField: '_id',
            as: 'workout',
          },
        },
        {
          $addFields: {
            workout: { $arrayElemAt: ['$workout', 0] },
          },
        },
        { $project: { workoutObjectId: 0 } },
      ])

      return session[0] || null
    } catch (err) {
      logger.error(`SessionService.getById failed for ${sessionId}`, err)
      throw err
    }
  }

  static async getByUserAndDate(
    userId: string,
    date: string
  ): Promise<ISession[]> {
    try {
      const dateFromISO = getDateFromISO(date)

      const sessions = await Session.aggregate([
        { $match: { userId, date: dateFromISO } },
        {
          $addFields: {
            workoutObjectId: {
              $cond: [
                { $eq: [{ $type: '$workoutId' }, 'string'] },
                { $toObjectId: '$workoutId' },
                '$workoutId',
              ],
            },
          },
        },
        {
          $lookup: {
            from: 'workouts',
            localField: 'workoutObjectId',
            foreignField: '_id',
            as: 'workout',
          },
        },
        {
          $addFields: {
            workout: { $arrayElemAt: ['$workout', 0] },
          },
        },
        { $project: { workoutObjectId: 0 } },
        { $sort: { createdAt: -1 } },
      ])

      return sessions[0] || null
    } catch (err) {
      logger.error(
        `SessionService.getByUserAndDate failed for user ${userId} date ${date}`,
        err
      )
      throw err
    }
  }

  static async listByUser(
    userId: string,
    limit = 30,
    filterBy: any = {}
  ): Promise<ISession[]> {
    try {
      const matchQuery: any = { userId, ...filterBy }

      const sessions = await Session.aggregate([
        { $match: matchQuery },
        {
          $addFields: {
            workoutObjectId: {
              $cond: [
                { $eq: [{ $type: '$workoutId' }, 'string'] },
                { $toObjectId: '$workoutId' },
                '$workoutId',
              ],
            },
          },
        },
        {
          $lookup: {
            from: 'workouts',
            localField: 'workoutObjectId',
            foreignField: '_id',
            as: 'workout',
          },
        },
        {
          $addFields: {
            workout: { $arrayElemAt: ['$workout', 0] },
          },
        },
        { $project: { workoutObjectId: 0 } },
        { $sort: { date: -1, createdAt: -1 } },
        { $limit: limit },
      ])

      return sessions
    } catch (err) {
      logger.error(`SessionService.listByUser failed for ${userId}`, err)
      throw err
    }
  }

  static async query(filterBy: any = {}) {
    try {
      const sessions = await Session.aggregate([
        { $match: filterBy },
        {
          $addFields: {
            workoutObjectId: {
              $cond: [
                { $eq: [{ $type: '$workoutId' }, 'string'] },
                { $toObjectId: '$workoutId' },
                '$workoutId',
              ],
            },
          },
        },
        {
          $lookup: {
            from: 'workouts',
            localField: 'workoutObjectId',
            foreignField: '_id',
            as: 'workout',
          },
        },
        {
          $addFields: {
            workout: { $arrayElemAt: ['$workout', 0] },
          },
        },
        { $project: { workoutObjectId: 0 } },
        { $sort: { date: -1, createdAt: -1 } },
      ])

      return sessions
    } catch (err) {
      logger.error('SessionService.query failed', err)
      throw err
    }
  }

  static async add(session: Partial<ISession>): Promise<ISession> {
    try {
      if (session.date) {
        session.date = getDateFromISO(session.date)
      }
      console.log('session', session)
      const addedSession = await Session.create(session)
      return addedSession
    } catch (err) {
      logger.error('SessionService.add failed', err)
      throw err
    }
  }

  static async update(
    sessionId: string,
    sessionToUpdate: Partial<ISession>
  ): Promise<ISession | null> {
    try {
      if (sessionToUpdate.date) {
        sessionToUpdate.date = getDateFromISO(sessionToUpdate.date)
      }

      const session = await Session.findByIdAndUpdate(
        sessionId,
        sessionToUpdate,
        { new: true }
      )

      return session
    } catch (err) {
      logger.error(`SessionService.update failed for ${sessionId}`, err)
      throw err
    }
  }

  static async remove(sessionId: string): Promise<void> {
    try {
      await Session.findByIdAndDelete(sessionId)
    } catch (err) {
      logger.error(`SessionService.remove failed for ${sessionId}`, err)
      throw err
    }
  }
}
