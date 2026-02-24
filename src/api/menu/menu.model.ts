import mongoose from 'mongoose'

export interface IMenu {
  userId: string
  menuLogs: mongoose.Types.ObjectId[]
  name: string
  isSelected: boolean
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
    name: {
      type: String,
      required: true,
    },
    isSelected: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

export const Menu = mongoose.model<IMenu>('Menu', menuSchema)
