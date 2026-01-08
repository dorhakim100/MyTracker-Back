import mongoose from 'mongoose'
import { Item } from '@/types/Item/Item'
import { Macros } from '@/types/Macros/Macros'
import { MealItem } from '@/types/MealItem/MealItem'

export interface IItem extends mongoose.Document {
  name: string
  searchId?: string
  searchTerm: string // Normalized search term for caching
  image?: string
  macros: Macros
  type: 'food' | 'product' | 'meal' | 'custom' | ''
  items?: MealItem[] // for meal type
}

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
    },
    searchId: {
      type: String,
      index: true,
    },
    searchTerm: {
      type: String,
      required: false,
      index: true,
    },
    image: {
      type: String,
    },
    macros: {
      type: Object,
      required: true,
    },
    type: {
      type: String,
      enum: ['food', 'product', 'meal', 'custom', ''],
      default: '',
    },
    items: {
      type: [Object],
      required: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

// Compound index for efficient search term lookups
itemSchema.index({ searchTerm: 1, searchId: 1 })
itemSchema.index({ name: 'text' }) // Text index for name searches

export const ItemModel = mongoose.model<IItem>('Item', itemSchema)
