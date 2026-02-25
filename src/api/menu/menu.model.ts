import mongoose from 'mongoose'

export interface IMenu {
  userId: string
  menuLogs: mongoose.Types.ObjectId[]
  isSelected: boolean
  name: string
}

const menuSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    menuLogs: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Log' }],
      default: () => [],
    },
    isSelected: { type: Boolean, default: false },
    name: { type: String, required: false, default: 'New Menu' },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

export const Menu = mongoose.model<IMenu & mongoose.Document>(
  'Menu',
  menuSchema
)
