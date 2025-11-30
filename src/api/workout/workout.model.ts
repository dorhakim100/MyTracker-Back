import mongoose from 'mongoose'
import { Exercise } from '@/types/Exercise/Exercise'

export interface IWorkout extends mongoose.Document {
  forUserId: string
  name: string
  exercises: Exercise[]
  muscleGroups: string[]
  isActive: boolean
}

const workoutSchema = new mongoose.Schema(
  {
    // Add your workout schema fields here
    forUserId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    exercises: {
      type: [Object],
      required: true,
    },
    muscleGroups: {
      type: [String],
      required: true,
    },
    isActive: {
      type: Boolean,

      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

export const Workout = mongoose.model<IWorkout>('Workout', workoutSchema)
