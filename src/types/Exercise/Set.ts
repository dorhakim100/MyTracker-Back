import { ExpectedActual } from '../ExpectedActual/ExpectedActual'

export interface Set {
  weight: ExpectedActual<number>
  reps: ExpectedActual<number>
  rpe?: ExpectedActual<number>
  rir?: ExpectedActual<number>
  isDone: boolean
}
