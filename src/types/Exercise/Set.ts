import { ExpectedActual } from '../ExpectedActual/ExpectedActual'

export interface Set {
  weight: ExpectedActual<number>
  reps: ExpectedActual<number>
  rpe?: ExpectedActual<number>
  rir?: ExpectedActual<number>
  isDone: boolean
}

export interface SetFilter {
  exerciseId?: string
  sessionId?: string
  workoutId?: string
  userId?: string
  from?: Date
  to?: Date
  skip?: number
  limit?: number
}

