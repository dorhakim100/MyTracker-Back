import { ExpectedActual } from '../ExpectedActual/ExpectedActual'

export interface WorkingSet {
  weight: ExpectedActual<number>
  reps: ExpectedActual<number>
  rpe?: ExpectedActual<number>
  rir?: ExpectedActual<number>
}
