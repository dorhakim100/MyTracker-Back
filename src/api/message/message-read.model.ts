import mongoose from 'mongoose'

export interface IMessageRead extends mongoose.Document {
  userId: string
  workoutId: string
  exerciseId: string
  lastReadAt: Date
}

const messageReadSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    workoutId: {
      type: String,
      required: true,
    },
    exerciseId: {
      type: String,
      required: true,
    },
    lastReadAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
    collection: 'messagereads',
  }
)

messageReadSchema.index(
  { userId: 1, workoutId: 1, exerciseId: 1 },
  { unique: true }
)

export const MessageRead = mongoose.model<IMessageRead>(
  'MessageRead',
  messageReadSchema
)
