import mongoose from 'mongoose'

export interface IBodyFatEstimate extends mongoose.Document {
  userId: string
  minPercent: number
  maxPercent: number
  note: string
  imageUrl: string
  weightKg: number
  createdAt: number
}

const bodyFatEstimateSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    minPercent: {
      type: Number,
      required: true,
    },
    maxPercent: {
      type: Number,
      required: true,
    },
    note: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    weightKg: {
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

bodyFatEstimateSchema.index({ userId: 1, createdAt: -1 })

export const BodyFatEstimate = mongoose.model<IBodyFatEstimate>(
  'BodyFatEstimate',
  bodyFatEstimateSchema
)
