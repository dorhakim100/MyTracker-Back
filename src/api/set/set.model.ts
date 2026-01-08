import { Set as WorkingSet } from '@/types/Exercise/Set'
import mongoose from 'mongoose'

export interface ISet extends mongoose.Document {
  sessionId: string
  exerciseId: string
  userId: string
  setNumber: number
  weight: WorkingSet['weight']
  reps: WorkingSet['reps']
  rpe?: WorkingSet['rpe']
  rir?: WorkingSet['rir']
  isDone: WorkingSet['isDone']
}

const setSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    exerciseId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    setNumber: {
      type: Number,
      required: true,
    },
    weight: {
      type: Object,
      required: true,
    },
    reps: {
      type: Object,
      required: true,
    },
    rpe: {
      type: Object,
      required: false,
    },
    rir: {
      type: Object,
      required: false,
    },
    isDone: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

setSchema.index({ sessionId: 1, exerciseId: 1, setNumber: 1 })

export const Set = mongoose.model<ISet>('Set', setSchema)
