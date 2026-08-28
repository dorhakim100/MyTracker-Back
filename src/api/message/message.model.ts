import mongoose from 'mongoose'

export type MessageRole = 'trainer' | 'trainee'
export type MessageType = 'text' | 'image' | 'video'

export interface IMessage extends mongoose.Document {
  date: Date
  exerciseId: string
  workoutId: string
  senderId: string
  role: MessageRole
  type: MessageType
  content: string
  media?: { url: string; mime?: string } | null
  editedAt?: Date | null
  deletedAt?: Date | null
}

const messageSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    exerciseId: {
      type: String,
      required: true,
      index: true,
    },
    workoutId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['trainer', 'trainee'],
    },
    type: {
      type: String,
      required: true,
      enum: ['text', 'image', 'video'],
      default: 'text',
    },
    content: {
      type: String,
      required: true,
    },
    media: {
      type: Object,
      required: false,
      default: null,
    },
    editedAt: {
      type: Date,
      required: false,
      default: null,
    },
    deletedAt: {
      type: Date,
      required: false,
      default: null,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
)

messageSchema.index({ workoutId: 1, exerciseId: 1, date: 1 })
messageSchema.index({ workoutId: 1, role: 1, deletedAt: 1 })

export const Message = mongoose.model<IMessage>('Message', messageSchema)
