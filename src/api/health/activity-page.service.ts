import { GoalModel } from '../goal/goal.model'
import { User } from '../user/user.model'
import { DEFAULT_DAILY_STEPS_GOAL } from '../user/user-details.util'
import { ActivityDayService } from './activity-day.service'
import {
  addDays,
  clampDateKey,
  daysFrom,
  monthOf,
  todayKey,
  weekdayIndex,
  yearOf,
} from './activity-dates'
import type { ActivityVendor } from './activity-day.model'

export type ActivityMetric = 'steps' | 'calories'
export type ActivityFrame = 'week' | 'month' | 'quarter' | 'year'

type DayValue = { date: string; value: number }
type Span = { start: string; end: string }

export type ActivityBar = Span & { value: number; goalHit: boolean }

export type ActivityPage = {
  metric: ActivityMetric
  frame: ActivityFrame
  start: string
  end: string
  goal: number
  axisHeight: number
  average: number
  goalDays: number
  total: number
  streak: number
  liveStreak: number
  canGoPrevious: boolean
  canGoNext: boolean
  canGoCurrent: boolean
  bars: ActivityBar[]
  cards: ActivityBar[]
}

type Row = {
  date: string
  vendor: ActivityVendor
  steps: number
  calories: number
}

export const ActivityPageService = {
  getPage,
}

async function getPage(
  userId: string,
  metric: ActivityMetric,
  frame: ActivityFrame,
  vendor: ActivityVendor,
  requestedEnd?: string
): Promise<ActivityPage> {
  const today = todayKey()
  const window = buildWindow(frame, requestedEnd, today)
  const previous = previousWindow(frame, window, today)
  const [goal, history] = await Promise.all([
    readGoal(userId, metric),
    ActivityDayService.findInRange(userId, '1970-01-01', today),
  ])
  const days = daysFrom(window.start, window.end)
  const rows = history.filter(
    (row) => row.date >= window.start && row.date <= window.end
  )
  const values = days.map((date) => ({
    date,
    value: mergeValue(rowsFor(rows, date), metric, vendor),
  }))
  const bars = groupBars(frame, values, goal)
  const cards = groupCards(frame, values, goal).reverse()
  const total = values.reduce((sum, day) => sum + day.value, 0)
  const goalDays = values.filter((day) => isHit(day.value, goal)).length
  const tallest = bars.reduce((max, bar) => Math.max(max, bar.value), 0)
  const onCurrent = window.end === currentEnd(frame, today)

  return {
    metric,
    frame,
    start: window.start,
    end: window.end,
    goal,
    axisHeight: Math.max(goal, tallest, 1),
    average: values.length ? Math.round(total / values.length) : 0,
    goalDays,
    total,
    streak: countStreak(history, metric, vendor, goal, window.end, today),
    liveStreak: countStreak(history, metric, vendor, goal, today, today),
    canGoPrevious: history.some(
      (row) => row.date >= previous.start && row.date <= previous.end
    ),
    canGoNext: !onCurrent,
    canGoCurrent: !onCurrent,
    bars,
    cards,
  }
}

function buildWindow(
  frame: ActivityFrame,
  requestedEnd: string | undefined,
  today: string
): Span {
  if (frame === 'year') {
    const currentYear = yearOf(today)
    const year = clampYear(requestedEnd, currentYear)
    const lastMonth = year === currentYear ? monthOf(today) : 12
    const start = `${year}-01-01`
    const monthEnd = lastDayOfMonth(year, lastMonth)
    const end = year === currentYear && monthEnd > today ? today : monthEnd
    return { start, end }
  }

  const end = clampDateKey(requestedEnd, today)
  if (frame === 'week') return { start: addDays(end, -6), end }
  if (frame === 'month') return { start: addDays(end, -29), end }
  return quarterWindow(end)
}

function quarterWindow(end: string): Span {
  const weekStart = addDays(end, -weekdayIndex(end))
  const start = addDays(weekStart, -12 * 7)
  return { start, end }
}

function previousWindow(
  frame: ActivityFrame,
  window: Span,
  today: string
): Span {
  if (frame === 'year') {
    const year = yearOf(window.start) - 1
    return { start: `${year}-01-01`, end: `${year}-12-31` }
  }
  return buildWindow(frame, addDays(window.start, -1), today)
}

function currentEnd(frame: ActivityFrame, today: string): string {
  return buildWindow(frame, undefined, today).end
}

function clampYear(requested: string | undefined, currentYear: number) {
  const year = Number(requested)
  if (!Number.isInteger(year) || year > currentYear || year < 1970) {
    return currentYear
  }
  return year
}

function lastDayOfMonth(year: number, month: number): string {
  const next =
    month === 12 ? `${year + 1}-01-01` : `${year}-${pad(month + 1)}-01`
  return addDays(next, -1)
}

function groupBars(
  frame: ActivityFrame,
  values: DayValue[],
  goal: number
): ActivityBar[] {
  if (frame === 'week' || frame === 'month')
    return values.map((day) => dayBar(day, goal))
  if (frame === 'year') return monthGroups(values)
  return weekGroups(values)
}

function groupCards(
  frame: ActivityFrame,
  values: DayValue[],
  goal: number
): ActivityBar[] {
  if (frame === 'week') return values.map((day) => dayBar(day, goal))
  if (frame === 'month')
    return chunk(values, 7).map((group) => spanBar(group, false))
  return groupBars(frame, values, goal).map((bar) => ({
    ...bar,
    goalHit: false,
  }))
}

function weekGroups(values: DayValue[]): ActivityBar[] {
  if (!values.length) return []
  const end = values[values.length - 1].date
  const weekStart = addDays(end, -weekdayIndex(end))
  const groups: ActivityBar[] = []
  let cursor = values[0].date
  while (cursor < weekStart) {
    const groupEnd = addDays(cursor, 6)
    groups.push(spanBar(sliceDays(values, cursor, groupEnd), false))
    cursor = addDays(groupEnd, 1)
  }
  groups.push(spanBar(sliceDays(values, weekStart, end), false))
  return groups
}

function monthGroups(values: DayValue[]): ActivityBar[] {
  const byMonth = new Map<string, DayValue[]>()
  for (const day of values) {
    const key = day.date.slice(0, 7)
    const group = byMonth.get(key) ?? []
    group.push(day)
    byMonth.set(key, group)
  }
  return [...byMonth.values()].map((group) => spanBar(group, false))
}

function dayBar(day: DayValue, goal: number): ActivityBar {
  return {
    start: day.date,
    end: day.date,
    value: day.value,
    goalHit: isHit(day.value, goal),
  }
}

function spanBar(days: DayValue[], goalHit: boolean): ActivityBar {
  if (!days.length) {
    return { start: '', end: '', value: 0, goalHit: false }
  }
  const total = days.reduce((sum, day) => sum + day.value, 0)
  return {
    start: days[0].date,
    end: days[days.length - 1].date,
    value: Math.round(total / days.length),
    goalHit,
  }
}

function sliceDays(values: DayValue[], start: string, end: string) {
  return values.filter((day) => day.date >= start && day.date <= end)
}

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size))
  }
  return groups
}

function countStreak(
  rows: Row[],
  metric: ActivityMetric,
  vendor: ActivityVendor,
  goal: number,
  anchor: string,
  today: string
) {
  if (goal <= 0) return 0

  const byDate = rowsByDate(rows)
  let cursor = anchor
  if (cursor === today) {
    const todayValue = mergeValue(byDate.get(cursor) ?? [], metric, vendor)
    if (!isHit(todayValue, goal)) cursor = addDays(cursor, -1)
  }

  let count = 0
  while (cursor >= '1970-01-01') {
    const value = mergeValue(byDate.get(cursor) ?? [], metric, vendor)
    if (!isHit(value, goal)) break
    count += 1
    cursor = addDays(cursor, -1)
    if (count > 20000) break
  }
  return count
}

function rowsByDate(rows: Row[]) {
  const byDate = new Map<string, Row[]>()
  for (const row of rows) {
    const group = byDate.get(row.date)
    if (group) group.push(row)
    else byDate.set(row.date, [row])
  }
  return byDate
}

function rowsFor(rows: Row[], date: string) {
  return rows.filter((row) => row.date === date)
}

function mergeValue(
  rows: Row[],
  metric: ActivityMetric,
  selected: ActivityVendor
) {
  const selectedRow = rows.find((row) => row.vendor === selected)
  const selectedValue = selectedRow ? valueOf(selectedRow, metric) : 0
  if (selectedValue > 0) return selectedValue

  return rows.reduce((best, row) => Math.max(best, valueOf(row, metric)), 0)
}

function valueOf(row: Row, metric: ActivityMetric) {
  return metric === 'steps' ? row.steps : row.calories
}

function isHit(value: number, goal: number) {
  return goal > 0 && value >= goal
}

async function readGoal(userId: string, metric: ActivityMetric) {
  if (metric === 'steps') {
    const user = await User.findById(userId)
      .select('details.dailyStepsGoal')
      .lean()
    return user?.details?.dailyStepsGoal || DEFAULT_DAILY_STEPS_GOAL
  }

  const current = await GoalModel.findOne({ userId, isSelected: true })
    .sort({ startDate: -1 })
    .select('dailyCalories target')
    .lean()
  const calories = Number(current?.dailyCalories) || 0
  if (!calories) return 0
  if (current?.target === 'lose') return calories + 500
  if (current?.target === 'gain') return Math.max(0, calories - 500)
  return calories
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}
