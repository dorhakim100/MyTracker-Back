import mongoose from 'mongoose'

export type ActivityVendor = 'google' | 'native'

export interface IActivityDay extends mongoose.Document {
  userId: string
  date: string
  vendor: ActivityVendor
  steps: number
  calories: number
}

const activityDaySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    vendor: { type: String, required: true, enum: ['google', 'native'] },
    steps: { type: Number, required: true, default: 0 },
    calories: { type: Number, required: true, default: 0 },
  },
  { versionKey: false }
)

activityDaySchema.index({ userId: 1, date: 1, vendor: 1 }, { unique: true })

export const ActivityDay = mongoose.model<IActivityDay>(
  'ActivityDay',
  activityDaySchema
)
