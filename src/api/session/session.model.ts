import mongoose from 'mongoose'
import { Exercise } from '@/types/Exercise/Exercise'

export interface ISession extends mongoose.Document {
  userId: string
  date: string
  workoutId: string | null
  exercises: Exercise[]
}

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    workoutId: {
      type: String || null,
      required: false,
      default: null,
    },
    exercises: {
      type: [Object],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

sessionSchema.index({ userId: 1, date: 1 }, { unique: false })

export const Session = mongoose.model<ISession>('Session', sessionSchema)
