import { Set } from './Set'
import { ExpectedActual } from '../ExpectedActual/ExpectedActual'

export interface ExerciseInstructions {
  exerciseId: string
  sets: Set[]
  notes: ExpectedActual<string>
  restingTime: number
}
