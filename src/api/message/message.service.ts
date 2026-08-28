import mongoose from 'mongoose'
import { Message, MessageRole } from './message.model'
import { MessageRead } from './message-read.model'
import { WorkoutService } from '../workout/workout.service'
import { Workout } from '../workout/workout.model'
import { User } from '../user/user.model'

export class AccessDeniedError extends Error {
  statusCode = 403
  constructor(message = 'Not allowed') {
    super(message)
  }
}

export class NotFoundError extends Error {
  statusCode = 404
  constructor(message = 'Not found') {
    super(message)
  }
}

const SENDER_LOOKUP = [
  {
    $addFields: {
      senderOid: {
        $cond: [
          {
            $regexMatch: {
              input: '$senderId',
              regex: '^[0-9a-fA-F]{24}$',
            },
          },
          { $toObjectId: '$senderId' },
          null,
        ],
      },
      workoutOid: {
        $cond: [
          {
            $regexMatch: {
              input: '$workoutId',
              regex: '^[0-9a-fA-F]{24}$',
            },
          },
          { $toObjectId: '$workoutId' },
          null,
        ],
      },
    },
  },
  {
    $lookup: {
      from: 'users',
      localField: 'senderOid',
      foreignField: '_id',
      pipeline: [
        {
          $project: {
            password: 0,
            googleRefreshToken: 0,
          },
        },
      ],
      as: 'senderDocs',
    },
  },
  {
    $lookup: {
      from: 'workouts',
      localField: 'workoutOid',
      foreignField: '_id',
      pipeline: [{ $project: { name: 1, forUserId: 1 } }],
      as: 'workoutDocs',
    },
  },
  {
    $lookup: {
      from: 'exercises',
      localField: 'exerciseId',
      foreignField: 'exerciseId',
      pipeline: [{ $project: { name: 1, image: 1, exerciseId: 1 } }],
      as: 'exerciseDocs',
    },
  },
  {
    $addFields: {
      sender: { $arrayElemAt: ['$senderDocs', 0] },
      workout: { $arrayElemAt: ['$workoutDocs', 0] },
      exercise: { $arrayElemAt: ['$exerciseDocs', 0] },
    },
  },
  {
    $project: {
      senderDocs: 0,
      exerciseDocs: 0,
      workoutDocs: 0,
      senderOid: 0,
      workoutOid: 0,
      'sender.password': 0,
    },
  },
]

export class MessageService {
  static async getWorkoutOrThrow(workoutId: string) {
    const workout = await WorkoutService.getById(workoutId)

    if (!workout) {
      throw new NotFoundError('Workout not found')
    }
    return workout
  }

  static async canAccessWorkout(
    userId: string,
    workout: { forUserId: string }
  ): Promise<boolean> {
    if (workout.forUserId === userId) return true
    const trainee = await User.findById(workout.forUserId)
      .select('trainersIds')
      .lean()
    const trainerIds = (trainee?.trainersIds || []).map(String)
    return trainerIds.includes(String(userId))
  }

  static async assertCanAccessWorkout(userId: string, workoutId: string) {
    const workout = await this.getWorkoutOrThrow(workoutId)
    const allowed = await this.canAccessWorkout(userId, workout)
    if (!allowed) {
      throw new AccessDeniedError()
    }
    return workout
  }

  static canActAsRole(
    userId: string,
    workout: { forUserId: string },
    role: MessageRole,
    trainerIds: string[]
  ): boolean {
    if (role === 'trainee') {
      return workout.forUserId === userId
    }
    return workout.forUserId === userId || trainerIds.includes(String(userId))
  }

  static async assertCanActAsRole(
    userId: string,
    workoutId: string,
    role: MessageRole
  ) {
    const workout = await this.assertCanAccessWorkout(userId, workoutId)

    const trainee = await User.findById(workout.forUserId)
      .select('trainersIds')
      .lean()
    console.log('trainee', trainee)
    const trainerIds = (trainee?.trainersIds || []).map(String)
    console.log('trainerIds', trainerIds)
    if (!this.canActAsRole(userId, workout, role, trainerIds)) {
      throw new AccessDeniedError()
    }
    return { workout, trainerIds }
  }

  static async notifyUserIdsForWorkout(workout: {
    forUserId: string
  }): Promise<string[]> {
    const trainee = await User.findById(workout.forUserId)
      .select('trainersIds')
      .lean()
    const trainerIds = (trainee?.trainersIds || []).map(String)
    return [workout.forUserId, ...trainerIds]
  }

  static async populateById(messageId: string) {
    const [doc] = await Message.aggregate([
      { $match: { _id: messageId } },
      ...SENDER_LOOKUP,
    ])
    return doc || null
  }

  static async listByRoom(
    userId: string,
    workoutId: string,
    exerciseId: string
  ) {
    await this.assertCanAccessWorkout(userId, workoutId)
    return Message.aggregate([
      {
        $match: {
          workoutId,
          exerciseId,
          deletedAt: null,
        },
      },
      { $sort: { date: 1 } },
      ...SENDER_LOOKUP,
    ])
  }

  static async add(
    userId: string,
    payload: {
      _id?: string
      workoutId: string
      exerciseId: string
      role: MessageRole
      content: string
    }
  ) {
    const content = (payload.content || '').trim()
    if (!content) {
      throw new Error('Message content is required')
    }
    if (payload.role !== 'trainer' && payload.role !== 'trainee') {
      throw new Error('Invalid role')
    }

    await this.assertCanActAsRole(userId, payload.workoutId, payload.role)

    const id = payload._id || new mongoose.Types.ObjectId().toString()
    await Message.create({
      _id: id,
      date: new Date(),
      workoutId: payload.workoutId,
      exerciseId: payload.exerciseId,
      senderId: userId,
      role: payload.role,
      type: 'text',
      content,
    })

    return this.populateById(id)
  }

  static async update(
    userId: string,
    messageId: string,
    role: MessageRole,
    content: string
  ) {
    const trimmed = (content || '').trim()
    if (!trimmed) {
      throw new Error('Message content is required')
    }

    const existing = await Message.findById(messageId)
    if (!existing || existing.deletedAt) {
      throw new NotFoundError('Message not found')
    }

    await this.assertCanActAsRole(userId, existing.workoutId, role)

    if (existing.role !== role) {
      throw new AccessDeniedError()
    }

    existing.content = trimmed
    existing.editedAt = new Date()
    await existing.save()
    return this.populateById(messageId)
  }

  static async remove(userId: string, messageId: string, role: MessageRole) {
    const existing = await Message.findById(messageId)
    if (!existing || existing.deletedAt) {
      throw new NotFoundError('Message not found')
    }

    await this.assertCanActAsRole(userId, existing.workoutId, role)

    if (existing.role !== role) {
      throw new AccessDeniedError()
    }

    existing.deletedAt = new Date()
    await existing.save()
    return existing
  }

  static async markRead(userId: string, workoutId: string, exerciseId: string) {
    await this.assertCanAccessWorkout(userId, workoutId)
    await MessageRead.findOneAndUpdate(
      { userId, workoutId, exerciseId },
      { lastReadAt: new Date() },
      { upsert: true, new: true }
    )
    return { ok: true }
  }

  static async unreadSummary(userId: string, asRole: MessageRole) {
    const otherRole: MessageRole = asRole === 'trainer' ? 'trainee' : 'trainer'
    const workouts = await this.workoutsForUnread(userId, asRole)
    const workoutIds = workouts.map((w) => String(w._id))

    if (workoutIds.length === 0) {
      return {
        trainees: {} as Record<string, number>,
        workouts: {} as Record<string, number>,
        exercises: {} as Record<string, Record<string, number>>,
        hasMessages: {
          trainees: {} as Record<string, boolean>,
          workouts: {} as Record<string, boolean>,
          exercises: {} as Record<string, Record<string, boolean>>,
        },
      }
    }

    const [rows, startedRows] = await Promise.all([
      Message.aggregate([
        {
          $match: {
            workoutId: { $in: workoutIds },
            role: otherRole,
            deletedAt: null,
          },
        },
        {
          $lookup: {
            from: 'messagereads',
            let: {
              workoutId: '$workoutId',
              exerciseId: '$exerciseId',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$userId', userId] },
                      { $eq: ['$workoutId', '$$workoutId'] },
                      { $eq: ['$exerciseId', '$$exerciseId'] },
                    ],
                  },
                },
              },
            ],
            as: 'reads',
          },
        },
        {
          $addFields: {
            lastReadAt: { $arrayElemAt: ['$reads.lastReadAt', 0] },
          },
        },
        {
          $match: {
            $expr: {
              $or: [
                { $eq: [{ $ifNull: ['$lastReadAt', null] }, null] },
                { $gt: ['$date', '$lastReadAt'] },
              ],
            },
          },
        },
        {
          $group: {
            _id: { workoutId: '$workoutId', exerciseId: '$exerciseId' },
            count: { $sum: 1 },
          },
        },
      ]),
      Message.aggregate([
        {
          $match: {
            workoutId: { $in: workoutIds },
            deletedAt: null,
          },
        },
        {
          $group: {
            _id: { workoutId: '$workoutId', exerciseId: '$exerciseId' },
          },
        },
      ]),
    ])

    const workoutById = new Map(
      workouts.map((w) => [String(w._id), String(w.forUserId)])
    )

    const trainees: Record<string, number> = {}
    const workoutCounts: Record<string, number> = {}
    const exercises: Record<string, Record<string, number>> = {}
    const hasMessages = {
      trainees: {} as Record<string, boolean>,
      workouts: {} as Record<string, boolean>,
      exercises: {} as Record<string, Record<string, boolean>>,
    }

    for (const row of rows) {
      const workoutId = row._id.workoutId as string
      const exerciseId = row._id.exerciseId as string
      const count = row.count as number
      const forUserId = workoutById.get(workoutId)
      if (!forUserId) continue

      workoutCounts[workoutId] = (workoutCounts[workoutId] || 0) + count
      trainees[forUserId] = (trainees[forUserId] || 0) + count
      if (!exercises[workoutId]) exercises[workoutId] = {}
      exercises[workoutId][exerciseId] =
        (exercises[workoutId][exerciseId] || 0) + count
    }

    for (const row of startedRows) {
      const workoutId = row._id.workoutId as string
      const exerciseId = row._id.exerciseId as string
      const forUserId = workoutById.get(workoutId)
      if (!forUserId) continue

      hasMessages.workouts[workoutId] = true
      hasMessages.trainees[forUserId] = true
      if (!hasMessages.exercises[workoutId]) {
        hasMessages.exercises[workoutId] = {}
      }
      hasMessages.exercises[workoutId][exerciseId] = true
    }

    return { trainees, workouts: workoutCounts, exercises, hasMessages }
  }

  private static async workoutsForUnread(
    userId: string,
    asRole: MessageRole
  ): Promise<Array<{ _id: unknown; forUserId: string }>> {
    if (asRole === 'trainee') {
      return Workout.find({ forUserId: userId })
        .select('_id forUserId')
        .lean() as Promise<Array<{ _id: unknown; forUserId: string }>>
    }

    const trainees = await User.find({ trainersIds: userId })
      .select('_id')
      .lean()
    const traineeIds = trainees.map((t) => String(t._id))
    traineeIds.push(userId)

    return Workout.find({ forUserId: { $in: traineeIds } })
      .select('_id forUserId')
      .lean() as Promise<Array<{ _id: unknown; forUserId: string }>>
  }
}
