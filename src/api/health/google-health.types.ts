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
}

export type DailyRollUpDataPoint = {
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
