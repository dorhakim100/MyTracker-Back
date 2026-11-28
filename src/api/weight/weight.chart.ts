import { addIsraelDays, israelDateKey, israelToday } from '../../utils/israel-date.util'
import {
  ChartRange,
  daysAgo,
  daysBetween,
  dayLabel,
  rangeDayCount,
  rangeDays,
} from '../../utils/chart-series.util'

const MOVING_AVERAGE_DAYS = 7

type LoggedWeight = { createdAt: number; kg: number }

export interface WeightChart {
  labels: string[]
  data: (number | null)[]
  movingAverage: (number | null)[]
  previousAverage: number | null
}

export function weightChartFetchFrom(range: ChartRange) {
  const count = rangeDayCount(range)
  if (!count) return 0
  return daysAgo(count + 13).getTime()
}

export function buildWeightChart(
  weights: LoggedWeight[],
  range: ChartRange
): WeightChart {
  const sorted = [...weights].sort((a, b) => a.createdAt - b.createdAt)
  const kgByDay = new Map(
    sorted.map((weight) => [israelDateKey(new Date(weight.createdAt)), weight.kg])
  )
  const valuesFor = (days: string[]) => days.map((day) => kgByDay.get(day) ?? null)

  const days = rangeDays(range, [...kgByDay.keys()])
  const data = valuesFor(days)

  const count = rangeDayCount(range)
  const today = israelToday()
  const previousDays = count
    ? daysBetween(addIsraelDays(today, -(count + 6)), addIsraelDays(today, -count))
    : []

  return {
    labels: days.map(dayLabel),
    data,
    movingAverage: movingAverageOf(data, valuesFor(previousDays), range === 'ALL'),
    previousAverage: previousAverageOf(sorted, count),
  }
}

function movingAverageOf(
  data: (number | null)[],
  previous: (number | null)[],
  isAll: boolean
) {
  const combined = [...previous, ...data]

  return data.map((kg, index) => {
    const period =
      kg == null
        ? combined.slice(index, index + MOVING_AVERAGE_DAYS)
        : windowEndingAt(combined, previous.length + index)
    const isFull = period.length === MOVING_AVERAGE_DAYS && !period.includes(null)
    if (isFull) return periodAverage(period)
    if (isAll) return null
    return periodAverage(fillMissing(period))
  })
}

// A logged day closes its 7-day window. A day with no weight keeps the 7 days before it.
function windowEndingAt(combined: (number | null)[], dayIndex: number) {
  const start = dayIndex - (MOVING_AVERAGE_DAYS - 1)
  return combined.slice(Math.max(start, 0), start + MOVING_AVERAGE_DAYS)
}

function periodAverage(period: (number | null)[] | null) {
  if (!period) return null
  const sum = period.reduce<number>((acc, value) => acc + (value ?? 0), 0)
  return +(sum / MOVING_AVERAGE_DAYS).toFixed(1)
}

function fillMissing(period: (number | null)[]) {
  const logged = period.filter((value): value is number => Boolean(value))
  if (!logged.length) return null

  const sum = logged.reduce((acc, value) => +(acc + value).toFixed(1), 0)
  const average = +(sum / logged.length).toFixed(1)
  return period.map((value) => value || average)
}

// Weekly-change fallback when the chart has no earlier week to compare
function previousAverageOf(weights: LoggedWeight[], count: number | null) {
  const from = count ? daysAgo(count + 13).getTime() : 0
  const to = count ? daysAgo(count + 6).getTime() : Date.now()
  const inWindow = weights.filter(
    (weight) => weight.createdAt >= from && weight.createdAt <= to
  )
  if (!inWindow.length) return null

  const sum = inWindow.reduce((acc, weight) => acc + weight.kg, 0)
  return +(sum / inWindow.length).toFixed(1)
}
