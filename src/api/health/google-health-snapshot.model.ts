import mongoose from 'mongoose'

export interface IGoogleHealthSnapshot extends mongoose.Document {
  userId: string
  date: string
  steps: number
  activeCaloriesKcal: number
  distance: number
  flightsClimbed: number
  window: {
    startIso: string
    endIso: string
  }
  createdAt: Date
  updatedAt: Date
}

const googleHealthSnapshotSchema = new mongoose.Schema(
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
    steps: {
      type: Number,
      required: true,
      default: 0,
    },
    activeCaloriesKcal: {
      type: Number,
      required: true,
      default: 0,
    },
    distance: {
      type: Number,
      required: true,
      default: 0,
    },
    flightsClimbed: {
      type: Number,
      required: true,
      default: 0,
    },
    window: {
      startIso: { type: String, required: true },
      endIso: { type: String, required: true },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

googleHealthSnapshotSchema.index({ userId: 1, date: 1 }, { unique: true })

export const GoogleHealthSnapshot = mongoose.model<IGoogleHealthSnapshot>(
  'GoogleHealthSnapshot',
  googleHealthSnapshotSchema
)
