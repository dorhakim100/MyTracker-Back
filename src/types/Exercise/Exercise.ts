export interface ExerciseDetail {
  [key: string]: any
}

export interface Exercise {
  name: string
  muscleGroups: string[]
  image: string
  equipment: string[]
  exerciseId: string
  mainMuscles?: string[]
  secondaryMuscles?: string[]
  equipments?: string[]
  details?: ExerciseDetail
}
