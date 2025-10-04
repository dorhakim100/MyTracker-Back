import mongoose from 'mongoose'

export interface IGoal {
  userId: string
  title: string
  dailyCalories: number
  macros: Partial<{ protein: number; carbs: number; fat: number }>
  startDate: number
  endDate: number | null
  isSelected: boolean
  target: 'lose' | 'maintain' | 'gain'
  targetWeight: number
  updatedAt: number
}

const goalSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    dailyCalories: {
      type: Number,
      required: true,
    },
    macros: {
      type: Object,
      default: {},
    },
    startDate: {
      type: Number,
      required: true,
      index: true,
    },
    endDate: {
      type: Number,
      default: null,
    },
    isSelected: {
      type: Boolean,
      default: false,
      index: true,
    },
    target: {
      type: String,
      enum: ['lose', 'maintain', 'gain'],
      required: true,
    },
    targetWeight: {
      type: Number,
      required: true,
    },
    updatedAt: {
      type: Number,
      default: () => Date.now(),
    },
  },
  {
    versionKey: false,
  }
)

goalSchema.index({ userId: 1, startDate: -1 })

export const GoalModel = mongoose.model<IGoal>('Goal', goalSchema)
