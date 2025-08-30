import { Macros } from '../Macros/Macros'

export interface Goal {
  _id: string
  isMain: boolean
  title: string
  updatedAt: Date

  dailyCalories: number
  macros: Macros
}
