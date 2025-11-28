import { ExerciseInstructions } from '@/types/Exercise/ExerciseInstructions'
import mongoose from 'mongoose'

export interface IInstructions extends mongoose.Document {
  workoutId: string
  exercises: ExerciseInstructions[]
  weekNumber: number
  isDone: boolean
}

const instructionsSchema = new mongoose.Schema(
  {
    workoutId: {
      type: String,
      required: true,
      index: true,
    },
    exercises: {
      type: [Object],
      required: true,
    },
    weekNumber: {
      type: Number,
      required: true,
    },
    isDone: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
)

export const Instructions = mongoose.model<IInstructions>(
  'Instructions',
  instructionsSchema
)
