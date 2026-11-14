export const ACTIVITY_TIMEZONE = 'Asia/Jerusalem'

export function todayKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ACTIVITY_TIMEZONE,
  }).format(now)
}

export function addDays(key: string, amount: number): string {
  const [year, month, day] = key.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + amount))
  const nextYear = date.getUTCFullYear()
  const nextMonth = String(date.getUTCMonth() + 1).padStart(2, '0')
  const nextDay = String(date.getUTCDate()).padStart(2, '0')
  return `${nextYear}-${nextMonth}-${nextDay}`
}

export function weekdayIndex(key: string): number {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

export function daysFrom(start: string, end: string): string[] {
  const days: string[] = []
  let cursor = start
  while (cursor <= end) {
    days.push(cursor)
    cursor = addDays(cursor, 1)
    if (days.length > 4000) break
  }
  return days
}

export function clampDateKey(end: string | undefined, today: string): string {
  if (!end || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end > today) return today
  return end
}

export function yearOf(key: string): number {
  return Number(key.slice(0, 4))
}

export function monthOf(key: string): number {
  return Number(key.slice(5, 7))
}
