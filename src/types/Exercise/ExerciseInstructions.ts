import { WorkingSet } from './WorkingSet'
import { ExpectedActual } from '../ExpectedActual/ExpectedActual'

export interface ExerciseInstructions {
  exerciseId: string
  workingSets: WorkingSet[]
  rpe: ExpectedActual<number>
  notes: ExpectedActual<string>
}
