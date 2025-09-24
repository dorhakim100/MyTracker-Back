import mongoose from 'mongoose'

export interface IWeight extends mongoose.Document {
  userId: string
  kg: number
  createdAt: number
}

const weightSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    kg: {
      type: Number,
      required: true,
    },
    createdAt: {
      type: Number,
      required: true,
      default: () => Date.now(),
      index: true,
    },
  },
  {
    versionKey: false,
  }
)

weightSchema.index({ userId: 1, createdAt: -1 })

export const Weight = mongoose.model<IWeight>('Weight', weightSchema)
