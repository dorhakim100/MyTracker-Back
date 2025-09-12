import { Macros } from '../Macros/Macros'

export interface MealItem {
  searchId: string
  numberOfServings: number
  servingSize: number
  macros: Macros
  image?: string
  name?: string
}
