import { WorkingSet } from './WorkingSet'
import { ExpectedActual } from '../ExpectedActual/ExpectedActual'

export interface ExerciseInstructions {
  exerciseId: string
  workingSets: WorkingSet[]
  notes: ExpectedActual<string>
}
