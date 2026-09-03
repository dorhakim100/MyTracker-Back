import mongoose from 'mongoose'
import { Macros } from '@/types/Macros/Macros'
import { MealItem } from '@/types/MealItem/MealItem'
import { ItemName } from '@/types/Item/LocalizedName'

export interface IItem extends mongoose.Document {
  name: ItemName
  searchId?: string
  searchTerm?: string
  searchTerms?: string[]
  image?: string
  macros: Macros
  type: 'food' | 'product' | 'meal' | 'custom' | ''
  items?: MealItem[]
  isImageSearched?: boolean
  popularity?: number
  isCurated?: boolean
  categories?: string[]
}

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
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
    searchTerms: {
      type: [String],
      required: false,
      index: true,
      default: [],
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
    isImageSearched: {
      type: Boolean,
      default: false,
    },
    popularity: {
      type: Number,
      default: 0,
      index: true,
    },
    isCurated: {
      type: Boolean,
      default: false,
    },
    categories: {
      type: [String],
      required: false,
      default: [],
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

itemSchema.index({ searchTerm: 1, searchId: 1 })
itemSchema.index({ 'name.eng': 1, popularity: -1 })
itemSchema.index({ 'name.he': 1, popularity: -1 })
itemSchema.index({ 'name.default': 1, popularity: -1 })
itemSchema.index({ popularity: -1, type: 1 })
itemSchema.index({ categories: 1, popularity: -1 })

export const ItemModel = mongoose.model<IItem>('Item', itemSchema)
