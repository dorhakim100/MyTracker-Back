import mongoose from 'mongoose'
import { Macros } from '../../types/Macros/Macros'

export interface ILog extends mongoose.Document {
  // _id: mongoose.Types.ObjectId
  itemId: string
  macros: Macros
  meal: string
  numberOfServings: number
  source: string
  time: number
  createdBy: string
  // imgUrl?: string
}

const logSchema = new mongoose.Schema(
  {
    // _id: {
    //   type: mongoose.Types.ObjectId,
    //   required: true,
    // },
    itemId: {
      type: String,
      required: true,
    },
    macros: {
      type: Object,
      required: true,
    },
    meal: {
      type: String,
      required: true,
    },
    numberOfServings: {
      type: Number,
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    time: {
      type: Number,
      required: true,
    },
    //
    createdBy: {
      type: String,
      // ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

export const Log = mongoose.model<ILog>('Log', logSchema)
