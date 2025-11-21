export interface Exercise {
  name: string
  muscleGroups: string[]
  image: string
  equipment: string[]
  exerciseId: string
  details?: ExerciseDetail
}

export interface ExerciseDetail {
  sets: {
    expected: number
    actual: number
  }
  reps: {
    expected: number
    actual: number
  }
  weight: {
    expected: number
    actual: number
  }
  rpe: {
    expected: number
    actual: number
  }
  notes?: {
    expected: string
    actual: string
  }
}
