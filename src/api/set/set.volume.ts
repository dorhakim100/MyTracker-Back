const TIME_ZONE = 'Asia/Jerusalem'

export type VolumeCalculation = 'daily_volume' | 'weekly_volume'

export interface VolumePoint {
  createdAt: string
  value: number
  secondary: number
}

type VolumeSet = {
  createdAt?: Date | string
  weight?: { actual?: number | null }
  reps?: { actual?: number | null }
}

export function aggregateVolume(
  sets: VolumeSet[],
  calculation: VolumeCalculation
): VolumePoint[] {
  const buckets = new Map<string, { value: number; secondary: number }>()

  for (const set of sets) {
    if (!set.createdAt) continue

    const dayKey = jerusalemDateKey(new Date(set.createdAt))
    const key = calculation === 'weekly_volume' ? sundayKey(dayKey) : dayKey
    const bucket = buckets.get(key) ?? { value: 0, secondary: 0 }
    const weight = set.weight?.actual ?? 0
    const reps = set.reps?.actual ?? 0

    bucket.value += weight * reps
    bucket.secondary += calculation === 'weekly_volume' ? 1 : reps
    buckets.set(key, bucket)
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, bucket]) => ({
      createdAt: `${key}T12:00:00`,
      value: bucket.value,
      secondary: bucket.secondary,
    }))
}

function jerusalemDateKey(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function sundayKey(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day))
  utc.setUTCDate(utc.getUTCDate() - utc.getUTCDay())

  const y = utc.getUTCFullYear()
  const m = String(utc.getUTCMonth() + 1).padStart(2, '0')
  const d = String(utc.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
