import mongoose from 'mongoose'

export interface ITrainerRequest extends mongoose.Document {
  trainerId: string
  traineeId: string
  status: 'pending' | 'approved' | 'rejected'
}

const trainerRequestSchema = new mongoose.Schema(
  {
    trainerId: {
      type: String,
      required: true,
      index: true,
    },
    traineeId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

// Compound index to prevent duplicate requests and enable fast lookups
trainerRequestSchema.index({ trainerId: 1, traineeId: 1 }, { unique: true })
trainerRequestSchema.index({ traineeId: 1, status: 1 })
trainerRequestSchema.index({ trainerId: 1, status: 1 })

export const TrainerRequest = mongoose.model<ITrainerRequest>(
  'TrainerRequest',
  trainerRequestSchema
)
