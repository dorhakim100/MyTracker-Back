import { Workout, IWorkout } from './workout.model'
import mongoose from 'mongoose'
import { logger } from '../../services/logger.service'
import { User } from '../user/user.model'

const NON_EMPTY_WORKOUT_MATCH = {
  $or: [{ isEmpty: false }, { isEmpty: { $exists: false } }],
}

export class WorkoutService {
  static getEmptyWorkout(forUserId: string) {
    return {
      name: 'Empty Workout',
      exercises: [],
      muscleGroups: [],
      isActive: true,
      forUserId,
      isEmpty: true,
    }
  }
  static async query(filterBy: {
    from?: string
    to?: string
    forUserId: string
    limit?: number
  }) {
    try {
      const workouts = await Workout.aggregate([
        {
          $match: {
            forUserId: filterBy.forUserId,
            isActive: true,
            ...NON_EMPTY_WORKOUT_MATCH,
          },
        },
        ...this.getIsNewInstructionsPipeline(),
      ])

      const inactiveMatch: Record<string, unknown> = {
        forUserId: filterBy.forUserId,
        isActive: false,
        ...NON_EMPTY_WORKOUT_MATCH,
      }

      if (filterBy.from || filterBy.to) {
        const from = filterBy.from ? new Date(filterBy.from) : new Date(0)
        const to = filterBy.to ? new Date(filterBy.to) : new Date()
        from.setHours(0, 0, 0, 0)
        to.setHours(23, 59, 59, 999)
        inactiveMatch.updatedAt = {
          $gte: from,
          $lte: to,
        }
      }

      const inactivePipeline: any[] = [
        { $match: inactiveMatch },
        { $sort: { updatedAt: -1 } },
      ]

      if (filterBy.limit && filterBy.limit > 0) {
        inactivePipeline.push({ $limit: filterBy.limit })
      }

      inactivePipeline.push(...this.getIsNewInstructionsPipeline())

      const inActiveWorkouts = await Workout.aggregate(inactivePipeline)

      return [...workouts, ...inActiveWorkouts]
    } catch (err) {
      logger.error('Failed to query workouts', err)
      throw err
    }
  }

  static async getActiveWorkoutsCount(forUserId: string) {
    return Workout.countDocuments({
      forUserId,
      isActive: true,
      ...NON_EMPTY_WORKOUT_MATCH,
    })
  }

  static async syncActiveWorkoutsCount(forUserId?: string) {
    if (!forUserId) return 0
    const count = await this.getActiveWorkoutsCount(forUserId)
    await User.findByIdAndUpdate(forUserId, { activeWorkoutsCount: count })
    return count
  }

  static async getById(workoutId: string) {
    try {
      const workouts = await Workout.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(workoutId) } },
        ...this.getIsNewInstructionsPipeline(),
      ])
      return workouts[0] || null
    } catch (err) {
      logger.error(`Failed to get workout ${workoutId}`, err)
      throw err
    }
  }

  static async add(workout: Partial<IWorkout>) {
    try {
      const addedWorkout = await Workout.create(workout)
      await this.syncActiveWorkoutsCount(addedWorkout.forUserId)
      return addedWorkout
    } catch (err) {
      logger.error('Failed to add workout', err)
      throw err
    }
  }

  static async update(workoutId: string, workoutToUpdate: Partial<IWorkout>) {
    try {
      const workout = await Workout.findByIdAndUpdate(
        workoutId,
        workoutToUpdate,
        {
          new: true,
        }
      )
      await this.syncActiveWorkoutsCount(workout?.forUserId)
      return workout
    } catch (err) {
      logger.error(`Failed to update workout ${workoutId}`, err)
      throw err
    }
  }

  static async remove(workoutId: string) {
    try {
      const workout = await Workout.findById(workoutId)
      await Workout.findByIdAndDelete(workoutId)
      await this.syncActiveWorkoutsCount(workout?.forUserId)
    } catch (err) {
      logger.error(`Failed to remove workout ${workoutId}`, err)
      throw err
    }
  }

  private static getIsNewInstructionsPipeline() {
    return [
      {
        $addFields: {
          workoutIdString: {
            $toString: '$_id',
          },
        },
      },
      {
        $lookup: {
          from: 'instructions',
          localField: 'workoutIdString',
          foreignField: 'workoutId',
          as: 'instructions',
        },
      },
      {
        $addFields: {
          isNewInstructions: {
            $cond: [
              {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: '$instructions',
                        as: 'instruction',
                        // cond: { $eq: ['$$instruction.isDone', false] },
                        cond: {
                          $and: [
                            {
                              $lt: [
                                '$$instruction.doneTimes',
                                '$$instruction.timesPerWeek',
                              ],
                            },
                            { $eq: ['$$instruction.isDone', false] },
                          ],
                        },
                      },
                    },
                  },
                  0,
                ],
              },
              true,
              false,
            ],
          },
          doneTimes: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$instructions',
                    as: 'instruction',
                    cond: { $eq: ['$$instruction.isDone', false] },
                  },
                },
                as: 'instruction',
                in: '$$instruction.doneTimes',
              },
            },
          },
          timesPerWeek: {
            $sum: {
              $map: {
                input: {
                  // $filter: {
                  //   input: '$instructions',
                  //   as: 'instruction',
                  //   cond: { $eq: ['$$instruction.isDone', false] },
                  // },
                  $slice: [
                    {
                      $filter: {
                        input: '$instructions',
                        as: 'instruction',
                        cond: { $eq: ['$$instruction.isDone', false] },
                      },
                    },
                    1 // take only the first unfinished instruction
                  ],
                },
                as: 'instruction',
                in: '$$instruction.timesPerWeek',
              },
            },
          },
        },
      },
      {
        $project: {
          workoutIdString: 0,
          instructions: 0,
        },
      },
    ]
  }
}
