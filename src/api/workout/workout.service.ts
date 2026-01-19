import { Workout, IWorkout } from './workout.model'
import mongoose from 'mongoose'
import { logger } from '../../services/logger.service'

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
    from: string
    to: string
    forUserId: string
  }) {
    try {
      const workouts = await Workout.aggregate([
        {
          $match: {
            forUserId: filterBy.forUserId,
            isActive: true,
            $or: [{ isEmpty: false }, { isEmpty: { $exists: false } }],
          },
        },
        ...this.getIsNewInstructionsPipeline(),
      ])

      const from = new Date(filterBy.from)
      const to = new Date(filterBy.to)

      // Extend "to" to the *end* of that day
      to.setHours(23, 59, 59, 999)
      // Extend "from" to the *start* of that day
      from.setHours(0, 0, 0, 0)

      const inActiveWorkouts = await Workout.aggregate([
        {
          $match: {
            forUserId: filterBy.forUserId,
            isActive: false,
            $or: [{ isEmpty: false }, { isEmpty: { $exists: false } }],
            createdAt: {
              $gte: from,
              $lte: to,
            },
            updatedAt: {
              $gte: from,
              $lte: to,
            },
          },
        },
        { $sort: { createdAt: -1 } },
        ...this.getIsNewInstructionsPipeline(),
      ])

      return [...workouts, ...inActiveWorkouts]
    } catch (err) {
      logger.error('Failed to query workouts', err)
      throw err
    }
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
      return workout
    } catch (err) {
      logger.error(`Failed to update workout ${workoutId}`, err)
      throw err
    }
  }

  static async remove(workoutId: string) {
    try {
      await Workout.findByIdAndDelete(workoutId)
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
