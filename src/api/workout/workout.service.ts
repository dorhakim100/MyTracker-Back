import { Workout, IWorkout } from './workout.model'
import mongoose from 'mongoose'
import { logger } from '../../services/logger.service'

export class WorkoutService {
  static async query(filterBy = {}) {
    try {
      const workouts = await Workout.aggregate([
        { $match: filterBy },
        ...this.getIsNewInstructionsPipeline(),
      ])

      return workouts
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
                        cond: { $eq: ['$$instruction.isDone', false] },
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
