import { GoogleHealthService } from './google-health.service'
import { GoogleOAuthService } from '../auth/google-oauth.service'
import { ActivityDayService } from './activity-day.service'
import { addDays, daysFrom } from './activity-dates'
import { logger } from '../../services/logger.service'
import type { CivilDateTime, DailyRollUpDataPoint } from './google-health.types'

const STEPS_CHUNK_DAYS = 90
const CALORIES_CHUNK_DAYS = 14

export const ActivityGoogleService = {
  saveRange,
  backfill,
}

async function saveRange(userId: string, start: string, end: string) {
  const status = await GoogleHealthService.getStatus(userId)
  if (!status.connected) return { status: 'not_connected' as const, saved: 0 }

  const accessToken = await GoogleOAuthService.getAccessTokenForUser(userId)
  const saved = await saveChunk(userId, accessToken, start, end)
  return { status: 'ok' as const, saved }
}

async function backfill(userId: string) {
  const status = await GoogleHealthService.getStatus(userId)
  if (!status.connected) return

  const accessToken = await GoogleOAuthService.getAccessTokenForUser(userId)
  let end = addDays(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
  }).format(new Date()), -1)

  for (let guard = 0; guard < 400; guard += 1) {
    const start = addDays(end, -(CALORIES_CHUNK_DAYS - 1))
    const saved = await saveChunk(userId, accessToken, start, end)
    if (saved === 0) break
    end = addDays(start, -1)
  }
}

async function saveChunk(
  userId: string,
  accessToken: string,
  start: string,
  end: string
) {
  const exclusiveEnd = addDays(end, 1)
  const [steps, calories] = await Promise.all([
    readType(accessToken, 'steps', start, exclusiveEnd, STEPS_CHUNK_DAYS),
    readType(
      accessToken,
      'total-calories',
      start,
      exclusiveEnd,
      CALORIES_CHUNK_DAYS
    ),
  ])

  if (!steps.length && !calories.length) return 0

  const byDate = new Map<string, { steps: number; calories: number }>()
  for (const date of daysFrom(start, end)) {
    byDate.set(date, { steps: 0, calories: 0 })
  }
  for (const point of steps) {
    const date = dateKey(point.civilStartTime)
    if (!date || !byDate.has(date)) continue
    byDate.get(date)!.steps = numberFrom(point.steps?.countSum)
  }
  for (const point of calories) {
    const date = dateKey(point.civilStartTime)
    if (!date || !byDate.has(date)) continue
    byDate.get(date)!.calories = caloriesFrom(point)
  }

  const oldest = oldestPointDate(steps, calories)
  const days = [...byDate.entries()]
    .filter(([date]) => !oldest || date >= oldest)
    .map(([date, value]) => ({ date, ...value }))

  await ActivityDayService.upsertDays(userId, 'google', days)
  return steps.length + calories.length
}

async function readType(
  accessToken: string,
  dataType: string,
  start: string,
  end: string,
  chunkDays: number
) {
  const points: DailyRollUpDataPoint[] = []
  let cursor = start
  while (cursor < end) {
    const chunkEnd = minDate(addDays(cursor, chunkDays), end)
    let pageToken: string | undefined
    do {
      const response = await GoogleHealthService.fetchDailyRollUp(
        accessToken,
        dataType,
        toCivil(cursor),
        toCivil(chunkEnd),
        pageToken
      )
      points.push(...(response.rollupDataPoints ?? []))
      pageToken = response.nextPageToken
    } while (pageToken)
    cursor = chunkEnd
  }
  return points
}

function oldestPointDate(steps: DailyRollUpDataPoint[], calories: DailyRollUpDataPoint[]) {
  const dates = [...steps, ...calories]
    .map((point) => dateKey(point.civilStartTime))
    .filter((date): date is string => Boolean(date))
    .sort()
  return dates[0]
}

function caloriesFrom(point: DailyRollUpDataPoint) {
  return numberFrom(
    point.totalCalories?.kcalSum ||
      point.totalCalories?.energyKilocaloriesSum ||
      point.totalCalories?.kilocaloriesSum
  )
}

function numberFrom(value: string | undefined) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.round(parsed) : 0
}

function dateKey(civil: CivilDateTime | undefined) {
  const date = civil?.date
  if (!date?.year || !date.month || !date.day) return null
  const month = String(date.month).padStart(2, '0')
  const day = String(date.day).padStart(2, '0')
  return `${date.year}-${month}-${day}`
}

function toCivil(key: string): CivilDateTime {
  const [year, month, day] = key.split('-').map(Number)
  return {
    date: { year, month, day },
    time: { hours: 0, minutes: 0, seconds: 0, nanos: 0 },
  }
}

function minDate(left: string, right: string) {
  return left < right ? left : right
}

export function logBackfillFailure(err: unknown) {
  logger.error('Google activity backfill failed', err)
}
