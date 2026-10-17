const TIME_ZONE = 'Asia/Jerusalem'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export type WeekMode = 'thisWeek' | 'last7'

export type DistributionTimeframe = 'thisWeek' | '7d' | '30d' | 'year' | 'all'

function pad(value: number) {
  return value < 10 ? `0${value}` : String(value)
}

export function israelDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value
  return `${year}-${month}-${day}`
}

export function israelToday(now = new Date()) {
  return israelDateKey(now)
}

export function addIsraelDays(key: string, amount: number) {
  const [year, month, day] = key.split('-').map(Number)
  const shifted = new Date(Date.UTC(year, month - 1, day + amount, 12))
  return israelDateKey(shifted)
}

function weekdayIndex(key: string) {
  const [year, month, day] = key.split('-').map(Number)
  const noon = new Date(Date.UTC(year, month - 1, day, 12))
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    weekday: 'short',
  }).format(noon)
  const index = WEEKDAYS.indexOf(weekday)
  return index < 0 ? 0 : index
}

function span(start: string, count: number) {
  const dates: string[] = []
  for (let offset = 0; offset < count; offset += 1) {
    dates.push(addIsraelDays(start, offset))
  }
  return dates
}

function lengthOf(timeframe: DistributionTimeframe | WeekMode) {
  if (timeframe === 'thisWeek' || timeframe === 'last7' || timeframe === '7d') {
    return 7
  }
  if (timeframe === '30d') return 30
  return 365
}

export function datesFor(
  timeframe: DistributionTimeframe | WeekMode,
  now = new Date()
) {
  if (timeframe === 'all') return null

  const today = israelToday(now)
  if (timeframe === 'thisWeek') {
    const start = addIsraelDays(today, -weekdayIndex(today))
    return span(start, 7)
  }

  const count = lengthOf(timeframe)
  return span(addIsraelDays(today, -(count - 1)), count)
}

export function previousDatesFor(
  timeframe: DistributionTimeframe,
  now = new Date()
) {
  if (timeframe === 'all') return null
  const current = datesFor(timeframe, now)
  if (!current?.length) return null
  return span(addIsraelDays(current[0], -current.length), current.length)
}

export function sessionIsraelDate(stored: string) {
  const parsed = new Date(stored)
  if (Number.isNaN(parsed.getTime())) return stored.slice(0, 10)
  return israelDateKey(parsed)
}
