import { addIsraelDays, israelToday } from './israel-date.util'

export type ChartRange = '1M' | '3M' | '6M' | '1Y' | 'ALL'

const RANGE_DAY_COUNT = {
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
}

const DAY_MS = 86400000

export function isChartRange(value: unknown): value is ChartRange {
  return value === 'ALL' || Object.keys(RANGE_DAY_COUNT).includes(String(value))
}

export function rangeDayCount(range: ChartRange): number | null {
  if (range === 'ALL') return null
  return RANGE_DAY_COUNT[range]
}

export function daysAgo(days: number) {
  return new Date(Date.now() - days * DAY_MS)
}

export function daysBetween(firstDay: string, lastDay: string) {
  const days: string[] = []
  for (let day = firstDay; day <= lastDay; day = addIsraelDays(day, 1)) {
    days.push(day)
  }
  return days
}

// 'ALL' starts at the earliest logged day, other ranges end today
export function rangeDays(range: ChartRange, loggedDays: string[]) {
  const today = israelToday()
  const count = rangeDayCount(range)
  if (count) return daysBetween(addIsraelDays(today, -(count - 1)), today)
  if (!loggedDays.length) return []

  const firstDay = loggedDays.reduce((first, day) => (day < first ? day : first))
  return daysBetween(firstDay, today)
}

export function dayLabel(day: string) {
  const [, month, date] = day.split('-').map(Number)
  return `${date}/${month}`
}
