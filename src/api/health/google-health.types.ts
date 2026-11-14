export type CivilDateTime = {
  date: { year: number; month: number; day: number }
  time?: { hours: number; minutes: number; seconds: number; nanos: number }
}

export type DailyRollUpRequest = {
  range: {
    start: CivilDateTime
    end: CivilDateTime
  }
  windowSizeDays?: number
  pageToken?: string
}

export type DailyRollUpDataPoint = {
  civilStartTime?: CivilDateTime
  civilEndTime?: CivilDateTime
  steps?: { countSum?: string }
  floors?: { countSum?: string }
  distance?: { millimetersSum?: string }
  activeEnergyBurned?: {
    energyKilocaloriesSum?: string
    kilocaloriesSum?: string
    kcalSum?: string
  }
  totalCalories?: {
    energyKilocaloriesSum?: string
    kilocaloriesSum?: string
    kcalSum?: string
  }
}

export type DailyRollUpResponse = {
  rollupDataPoints?: DailyRollUpDataPoint[]
  nextPageToken?: string
}

export type TodayActivitySummaryResponse =
  | {
      status: 'ok'
      steps: number
      activeCaloriesKcal: number
      distance: number
      flightsClimbed: number
      window: { startIso: string; endIso: string }
    }
  | { status: 'not_connected' }
  | { status: 'error'; message: string }

export type GoogleHealthStatusResponse = {
  connected: boolean
  googleEmail: string | null
  provider: 'google' | null
}

export type GoogleHealthSnapshotResponse = {
  status: 'ok'
  steps: number
  activeCaloriesKcal: number
  distance: number
  flightsClimbed: number
  window: { startIso: string; endIso: string }
  updatedAt: string
}
