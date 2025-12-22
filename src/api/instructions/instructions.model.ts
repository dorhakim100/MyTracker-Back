import { ExerciseInstructions } from '@/types/Exercise/ExerciseInstructions'
import mongoose from 'mongoose'

export interface IInstructions extends mongoose.Document {
  workoutId: string
  exercises: ExerciseInstructions[]
  weekNumber: number
  timesPerWeek: number
  doneTimes: number
  isDone: boolean
  isFinished: boolean
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
    timesPerWeek: {
      type: Number,
      required: true,
      default: 1,
    },
    doneTimes: {
      type: Number,
      required: true,
      default: 0,
    },
    isDone: {
      type: Boolean,
      default: false,
    },
    isFinished: {
      type: Boolean,
      required: true,
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
