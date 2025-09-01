import mongoose from 'mongoose'

export interface IDay extends mongoose.Document {
  userId?: string
  date: string
  logs: string[]
  calories: number
  createdAt: Date
  updatedAt: Date
}

const daySchema = new mongoose.Schema(
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
    logs: {
      type: [String],
      default: [],
      required: true,
    },
    calories: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

daySchema.index({ userId: 1, date: 1 }, { unique: true })

export const Day = mongoose.model<IDay>('Day', daySchema)
