import type { DailyRollUpDataPoint } from './google-health.types'

function parseNumeric(value: string | undefined): number {
  if (!value) return 0
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export function extractRollUpValue(
  rollupDataPoints: DailyRollUpDataPoint[] | undefined,
  picker: (point: DailyRollUpDataPoint) => string | undefined
): number {
  if (!rollupDataPoints?.length) return 0
  return parseNumeric(picker(rollupDataPoints[0]))
}

export function extractSteps(
  rollupDataPoints?: DailyRollUpDataPoint[]
): number {
  return extractRollUpValue(rollupDataPoints, (point) => point.steps?.countSum)
}

export function extractFloors(
  rollupDataPoints?: DailyRollUpDataPoint[]
): number {
  return extractRollUpValue(rollupDataPoints, (point) => point.floors?.countSum)
}

export function extractDistanceKm(
  rollupDataPoints?: DailyRollUpDataPoint[]
): number {
  const millimeters = extractRollUpValue(
    rollupDataPoints,
    (point) => point.distance?.millimetersSum
  )
  return millimeters / 1_000_000
}

export function extractActiveCalories(
  activeEnergyRollup?: DailyRollUpDataPoint[],
  totalCaloriesRollup?: DailyRollUpDataPoint[]
): number {
  const activeEnergy = extractRollUpValue(
    activeEnergyRollup,
    (point) =>
      point.activeEnergyBurned?.energyKilocaloriesSum ||
      point.activeEnergyBurned?.kilocaloriesSum
  )
  if (activeEnergy > 0) return activeEnergy

  return extractRollUpValue(
    totalCaloriesRollup,
    (point) =>
      point.totalCalories?.energyKilocaloriesSum ||
      point.totalCalories?.kilocaloriesSum
  )
}

export function roundValue(value: number | string, digits = 0): number {
  if (typeof value === 'string') {
    value = Number(value)
  }
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
