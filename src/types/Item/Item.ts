import { Macros } from '../Macros/Macros'
import { MealItem } from '../MealItem/MealItem'

export interface Item {
  _id?: string
  name: string
  searchId?: string
  image?: string
  macros: Macros
  type: 'food' | 'product' | 'meal' | 'custom' | ''
  items?: MealItem[] // for meal type
}
