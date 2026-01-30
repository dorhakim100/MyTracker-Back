import mongoose from 'mongoose'
import { Macros } from '../../types/Macros/Macros'

export interface ILog extends mongoose.Document {
  // _id: mongoose.Types.ObjectId
  itemId: string
  macros: Macros
  meal: string
  numberOfServings: number
  source: string
  mealId?: string
  time: number
  createdBy: string
  name?: string
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
      required: false,
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
    servingSize: {
      type: Number,
      required: true,
    },
    source: {
      type: String,
      required: true,
    },
    mealId: {
      type: String,
      required: false,
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
    name: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

export const Log = mongoose.model<ILog>('Log', logSchema)
