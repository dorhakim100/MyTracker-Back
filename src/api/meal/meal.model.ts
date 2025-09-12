import mongoose from 'mongoose'
import { Macros } from '../../types/Macros/Macros'
import { MealItem } from '../../types/MealItem/MealItem'

export interface IMeal extends mongoose.Document {
  // _id: mongoose.Types.ObjectId
  items: MealItem[]
  createdBy: string
  name: string
  macros: Macros
}

const mealSchema = new mongoose.Schema(
  {
    // _id: {
    //   type: mongoose.Types.ObjectId,
    //   required: true,
    // },
    items: {
      type: [Object],
      required: true,
      default: [],
    },
    macros: {
      type: Object,
      required: true,
    },
    name: {
      type: String,
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

export const Meal = mongoose.model<IMeal>('Meal', mealSchema)
