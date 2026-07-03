export const HEALTH_SYNC_TIMEZONE = 'Asia/Jerusalem'
export const HEALTH_SYNC_START_HOUR = 8
export const HEALTH_SYNC_END_HOUR = 23

type SyncWindowParts = {
  hour: number
  minute: number
}

function getSyncWindowParts(
  now: Date,
  timezone: string = HEALTH_SYNC_TIMEZONE
): SyncWindowParts {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(now)
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0')
  const minute = Number(
    parts.find((part) => part.type === 'minute')?.value ?? '0'
  )

  return { hour, minute }
}

export function isWithinSyncWindow(
  now: Date = new Date(),
  timezone: string = HEALTH_SYNC_TIMEZONE,
  startHour: number = HEALTH_SYNC_START_HOUR,
  endHour: number = HEALTH_SYNC_END_HOUR
): boolean {
  const { hour, minute } = getSyncWindowParts(now, timezone)
  const totalMinutes = hour * 60 + minute
  const startMinutes = startHour * 60
  const endMinutes = endHour * 60

  return totalMinutes >= startMinutes && totalMinutes < endMinutes
}

export function getIsraelDateKey(
  now: Date = new Date(),
  timezone: string = HEALTH_SYNC_TIMEZONE
): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now)
}
