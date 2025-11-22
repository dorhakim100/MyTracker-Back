import mongoose from 'mongoose'

export interface ISet extends mongoose.Document {
  exerciseId: string
  workoutId: string
  reps: number
  weight: number
}

const setSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: String,
      required: true,
      index: true,
    },
    workoutId: {
      type: String,
      required: true,
      index: true,
    },
    reps: {
      type: Number,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
)

export const Set = mongoose.model<ISet>('Set', setSchema)
