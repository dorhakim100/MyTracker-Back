import { Workout, IWorkout } from './workout.model'
import { logger } from '../../services/logger.service'

export class WorkoutService {
  static async query(filterBy = {}) {
    try {
      const workouts = await Workout.find(filterBy)
      return workouts
    } catch (err) {
      logger.error('Failed to query workouts', err)
      throw err
    }
  }

  static async getById(workoutId: string) {
    try {
      const workout = await Workout.findById(workoutId)
      return workout
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
}
