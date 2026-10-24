import mongoose from 'mongoose'

export interface IWeight extends mongoose.Document {
  userId: string
  kg?: number
  waistCm?: number
  bodyFat?: number
  neckCm?: number
  chestCm?: number
  armsCm?: number
  hipsCm?: number
  thighCm?: number
  calfCm?: number
  imageUrl?: string
  createdAt: number
}

const weightSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    kg: { type: Number },
    waistCm: { type: Number },
    bodyFat: { type: Number },
    neckCm: { type: Number },
    chestCm: { type: Number },
    armsCm: { type: Number },
    hipsCm: { type: Number },
    thighCm: { type: Number },
    calfCm: { type: Number },
    imageUrl: { type: String },
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
