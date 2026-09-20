import { PrType } from './stats.accuracy'

export interface SessionPr {
  type: PrType
  exerciseId: string
  name: string
  current: number
  previous?: number
}

export interface SessionStatsExercise {
  exerciseId: string
  name: string
  image?: string
  actualRpe: number | null
  accuracy: number | null
  prs: SessionPr[]
}

export interface SessionStatsRecap {
  durationMs: number
  actualRpe: number | null
  accuracy: number | null
  volumeActual: number
  volumePlanned: number
  setsDone: number
  setsPlanned: number
  vsLastPercent: number | null
  exercises: SessionStatsExercise[]
}
