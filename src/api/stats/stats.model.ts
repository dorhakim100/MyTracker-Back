import mongoose from 'mongoose'

export interface ITimeFrame {
  from: string
  to: string | null
}

export interface IStats extends mongoose.Document {
  sessionId: string
  userId: string
  timeFrames: ITimeFrame[]
}

const timeFrameSchema = new mongoose.Schema(
  {
    from: { type: String, required: true },
    to: { type: String, default: null },
  },
  { _id: false }
)

const statsSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    timeFrames: {
      type: [timeFrameSchema],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

export const Stats = mongoose.model<IStats>('Stats', statsSchema)
