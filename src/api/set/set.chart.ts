import { addIsraelDays, israelDateKey } from '../../utils/israel-date.util'
import { ChartRange, dayLabel, rangeDays } from '../../utils/chart-series.util'
import { aggregateVolume } from './set.volume'

export type SetChartViewBy = 'weight' | 'reps' | 'daily_volume' | 'weekly_volume'

type Metric = 'weight' | 'reps'

type ChartSet = {
  createdAt?: Date | string
  weight?: { actual?: number | null }
  reps?: { actual?: number | null }
}

type DayPoint = { day: string; value: number; secondary: number | null }

export interface SetChart {
  labels: string[]
  data: (number | null)[]
  secondary: (number | null)[]
}

export function isSetChartViewBy(value: unknown): value is SetChartViewBy {
  return (
    value === 'weight' ||
    value === 'reps' ||
    value === 'daily_volume' ||
    value === 'weekly_volume'
  )
}

export function buildSetChart(
  sets: ChartSet[],
  range: ChartRange,
  viewBy: SetChartViewBy
): SetChart {
  if (viewBy === 'weekly_volume') {
    const weeks = aggregateVolume(sets, 'weekly_volume')
    return {
      labels: weeks.map((week) => weekLabel(week.createdAt.slice(0, 10))),
      data: weeks.map((week) => week.value),
      secondary: weeks.map((week) => week.secondary),
    }
  }

  const points =
    viewBy === 'daily_volume'
      ? aggregateVolume(sets, 'daily_volume').map((point) => ({
          day: point.createdAt.slice(0, 10),
          value: point.value,
          secondary: point.secondary,
        }))
      : bestSetPerDay(sets, viewBy)

  const pointByDay = new Map(points.map((point) => [point.day, point]))
  const days = rangeDays(range, [...pointByDay.keys()])

  return {
    labels: days.map(dayLabel),
    data: days.map((day) => pointByDay.get(day)?.value ?? null),
    secondary: days.map((day) => pointByDay.get(day)?.secondary ?? null),
  }
}

function bestSetPerDay(sets: ChartSet[], main: Metric): DayPoint[] {
  const secondary: Metric = main === 'weight' ? 'reps' : 'weight'
  const setsByDay = new Map<string, ChartSet[]>()

  for (const set of sets) {
    if (!set.createdAt) continue
    const day = israelDateKey(new Date(set.createdAt))
    setsByDay.set(day, [...(setsByDay.get(day) ?? []), set])
  }

  const points: DayPoint[] = []
  for (const [day, daySets] of setsByDay) {
    const best = pickBestSet(daySets, main)
    const value = best[main]?.actual
    if (value == null) continue
    points.push({ day, value, secondary: best[secondary]?.actual ?? null })
  }
  return points
}

function pickBestSet(sets: ChartSet[], main: Metric) {
  const secondary: Metric = main === 'weight' ? 'reps' : 'weight'

  return sets.reduce((best, set) => {
    const mainValue = set[main]?.actual ?? 0
    const bestMain = best[main]?.actual ?? 0
    if (mainValue !== bestMain) return mainValue > bestMain ? set : best

    const secondaryValue = set[secondary]?.actual ?? 0
    const bestSecondary = best[secondary]?.actual ?? 0
    return secondaryValue > bestSecondary ? set : best
  })
}

function weekLabel(sunday: string) {
  return `${dayLabel(sunday)}-${dayLabel(addIsraelDays(sunday, 6))}`
}
