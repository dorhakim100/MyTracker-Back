import { ExpectedActual } from '../ExpectedActual/ExpectedActual'

type SetTypeName = 'normal' | 'warmUp' | 'failure' | 'drop' | 'myoReps'

export interface Set {
  weight: ExpectedActual<number>
  reps: ExpectedActual<number>
  rpe?: ExpectedActual<number>
  rir?: ExpectedActual<number>
  isDone: boolean
  isDuringWorkout?: boolean
  type?: SetTypeName | ExpectedActual<SetTypeName>
  restingTime?: number
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
  calculation?: 'daily_volume' | 'weekly_volume'
}

