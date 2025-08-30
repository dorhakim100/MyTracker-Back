import { Macros } from '../Macros/Macros'

export interface Log {
  itemId: string
  searchId?: string
  meal: string
  macros: Macros
  time: number
  image?: string
  name?: string
  servingSize?: number
  numberOfServings?: number
  source?: string
}
