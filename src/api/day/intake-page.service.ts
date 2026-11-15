import { GoalModel } from '../goal/goal.model'
import { Day } from './day.model'
import {
  addDays,
  clampDateKey,
  daysFrom,
  monthOf,
  todayKey,
  weekdayIndex,
  yearOf,
} from '../health/activity-dates'

export type IntakeFrame = 'week' | 'month' | 'quarter' | 'year'
export type IntakeTarget = 'lose' | 'maintain' | 'gain'

type Span = { start: string; end: string }

type GoalSpan = {
  dailyCalories: number
  target: IntakeTarget
  start: string
  end: string | null
  startMs: number
  rangeLow: number
  rangeHigh: number
  selected: boolean
}

type FoodDay = {
  date: string
  calories?: number
  logs?: string[]
}

type IntakeDay = {
  date: string
  logged: boolean
  value: number
  goal: number
  target: IntakeTarget | null
  rangeLow?: number
  rangeHigh?: number
  hit: boolean
}

export type IntakeBar = Span & {
  value: number
  logged: boolean
  goalHit: boolean
  goal: number
  target: IntakeTarget | null
  rangeLow?: number
  rangeHigh?: number
}

export type IntakePage = {
  frame: IntakeFrame
  start: string
  end: string
  goal: number
  target: IntakeTarget | null
  axisHeight: number
  average: number
  goalDays: number
  total: number
  streak: number
  liveStreak: number
  canGoPrevious: boolean
  canGoNext: boolean
  canGoCurrent: boolean
  bars: IntakeBar[]
  cards: IntakeBar[]
}

const FRAMES: IntakeFrame[] = ['week', 'month', 'quarter', 'year']

export const IntakePageService = {
  getPage,
  isFrame,
}

function isFrame(frame: string): frame is IntakeFrame {
  return FRAMES.includes(frame as IntakeFrame)
}

async function getPage(
  userId: string,
  frame: IntakeFrame,
  requestedEnd?: string
): Promise<IntakePage> {
  const today = todayKey()
  const window = buildWindow(frame, requestedEnd, today)
  const [foodDays, goals] = await Promise.all([
    Day.find({ userId, date: { $lte: today } })
      .select('date calories logs')
      .lean(),
    GoalModel.find({ userId })
      .select('dailyCalories target startDate endDate isSelected')
      .lean(),
  ])
  const foodByDate = new Map(foodDays.map((day) => [day.date, day]))
  const spans = goals.flatMap(toSpan)
  const read = (date: string) => readDay(date, foodByDate, spans)
  const values = daysFrom(window.start, window.end).map(read)
  const bars = groupBars(frame, values)
  const cards = groupCards(frame, values).reverse()
  const logged = values.filter((day) => day.logged)
  const total = logged.reduce((sum, day) => sum + day.value, 0)
  const tallestBar = bars.reduce((max, bar) => Math.max(max, bar.value), 0)
  const tallestRange = bars.reduce(
    (max, bar) => Math.max(max, bar.rangeHigh ?? 0),
    0
  )
  const last = values[values.length - 1]
  const onCurrent = window.end === currentEnd(frame, today)

  return {
    frame,
    start: window.start,
    end: window.end,
    goal: last?.goal ?? 0,
    target: last?.target ?? null,
    axisHeight: Math.max(last?.goal ?? 0, tallestBar, tallestRange, 1),
    average: logged.length ? Math.round(total / logged.length) : 0,
    goalDays: values.filter((day) => day.hit).length,
    total,
    streak: countStreak(read, window.end, today),
    liveStreak: countStreak(read, today, today),
    canGoPrevious: foodDays.some(
      (day) => day.date < window.start && hasLogs(day)
    ),
    canGoNext: !onCurrent,
    canGoCurrent: !onCurrent,
    bars,
    cards,
  }
}

function readDay(
  date: string,
  foodByDate: Map<string, FoodDay>,
  spans: GoalSpan[]
): IntakeDay {
  const food = foodByDate.get(date)
  const logged = hasLogs(food)
  const value = logged ? Math.round(Number(food?.calories) || 0) : 0
  const goal = goalFor(date, spans)
  const hit = Boolean(
    goal && logged && value >= goal.rangeLow && value <= goal.rangeHigh
  )

  return {
    date,
    logged,
    value,
    goal: goal?.dailyCalories ?? 0,
    target: goal?.target ?? null,
    rangeLow: goal?.rangeLow,
    rangeHigh: goal?.rangeHigh,
    hit,
  }
}

function hasLogs(day?: FoodDay | null) {
  return Boolean(day?.logs && day.logs.length > 0)
}

function toSpan(goal: {
  dailyCalories?: number
  target?: string
  startDate?: number
  endDate?: number | null
  isSelected?: boolean
}): GoalSpan[] {
  const calories = Math.round(Number(goal.dailyCalories) || 0)
  if (!calories || !goal.startDate) return []
  if (
    goal.target !== 'lose' &&
    goal.target !== 'maintain' &&
    goal.target !== 'gain'
  ) {
    return []
  }
  return [
    {
      dailyCalories: calories,
      target: goal.target,
      start: keyFromMs(goal.startDate),
      end: goal.endDate ? keyFromMs(goal.endDate) : null,
      startMs: goal.startDate,
      rangeLow: Math.max(0, calories - 200),
      rangeHigh: calories + 200,
      selected: Boolean(goal.isSelected),
    },
  ]
}

function goalFor(date: string, spans: GoalSpan[]) {
  let match: GoalSpan | null = null
  for (const span of spans) {
    if (date < span.start) continue
    if (span.end && date > span.end) continue
    if (!match || span.startMs > match.startMs) match = span
  }
  if (match) return match

  // The app keeps using the selected goal after its end date.
  let selected: GoalSpan | null = null
  for (const span of spans) {
    if (!span.selected || date < span.start) continue
    if (!selected || span.startMs > selected.startMs) selected = span
  }
  return selected
}

function countStreak(
  read: (date: string) => IntakeDay,
  anchor: string,
  today: string
) {
  let cursor = anchor
  if (anchor === today && !read(anchor).hit) cursor = addDays(anchor, -1)
  else if (!read(anchor).hit) return 0

  let count = 0
  let steps = 0
  while (cursor >= '1970-01-01' && steps < 20000) {
    steps += 1
    const day = read(cursor)
    if (!day.target) {
      cursor = addDays(cursor, -1)
      continue
    }
    if (!day.hit) break
    count += 1
    cursor = addDays(cursor, -1)
  }
  return count
}

function groupBars(frame: IntakeFrame, values: IntakeDay[]): IntakeBar[] {
  if (frame === 'week' || frame === 'month') {
    return values.map((day) => dayBar(day))
  }
  if (frame === 'year') return monthGroups(values)
  return weekGroups(values)
}

function groupCards(frame: IntakeFrame, values: IntakeDay[]): IntakeBar[] {
  if (frame === 'week') return values.map((day) => dayBar(day))
  if (frame === 'month') {
    return chunk(values, 7).map((group) => spanBar(group))
  }
  return groupBars(frame, values).map((bar) => ({ ...bar, goalHit: false }))
}

function weekGroups(values: IntakeDay[]): IntakeBar[] {
  if (!values.length) return []
  const end = values[values.length - 1].date
  const weekStart = addDays(end, -weekdayIndex(end))
  const groups: IntakeBar[] = []
  let cursor = values[0].date
  while (cursor < weekStart) {
    const groupEnd = addDays(cursor, 6)
    groups.push(spanBar(sliceDays(values, cursor, groupEnd)))
    cursor = addDays(groupEnd, 1)
  }
  groups.push(spanBar(sliceDays(values, weekStart, end)))
  return groups
}

function monthGroups(values: IntakeDay[]): IntakeBar[] {
  const byMonth = new Map<string, IntakeDay[]>()
  for (const day of values) {
    const key = day.date.slice(0, 7)
    const group = byMonth.get(key) ?? []
    group.push(day)
    byMonth.set(key, group)
  }
  return [...byMonth.values()].map((group) => spanBar(group))
}

function dayBar(day: IntakeDay): IntakeBar {
  return {
    start: day.date,
    end: day.date,
    value: day.value,
    logged: day.logged,
    goalHit: day.hit,
    goal: day.goal,
    target: day.target,
    rangeLow: day.rangeLow,
    rangeHigh: day.rangeHigh,
  }
}

function spanBar(days: IntakeDay[]): IntakeBar {
  if (!days.length) {
    return {
      start: '',
      end: '',
      value: 0,
      logged: false,
      goalHit: false,
      goal: 0,
      target: null,
    }
  }
  const logged = days.filter((day) => day.logged)
  const withGoal = days.filter((day) => day.target)
  const last = days[days.length - 1]
  const goal = withGoal.length
    ? Math.round(
        withGoal.reduce((sum, day) => sum + day.goal, 0) / withGoal.length
      )
    : 0
  const target = last.target
  const ranged = Boolean(target) && goal > 0
  const value = logged.length
    ? Math.round(logged.reduce((sum, day) => sum + day.value, 0) / logged.length)
    : 0

  return {
    start: days[0].date,
    end: last.date,
    value,
    logged: logged.length > 0,
    goalHit: false,
    goal,
    target: ranged ? target : null,
    rangeLow: ranged ? Math.max(0, goal - 200) : undefined,
    rangeHigh: ranged ? goal + 200 : undefined,
  }
}

function sliceDays(values: IntakeDay[], start: string, end: string) {
  return values.filter((day) => day.date >= start && day.date <= end)
}

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size))
  }
  return groups
}

function buildWindow(
  frame: IntakeFrame,
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
  return { start: addDays(weekStart, -12 * 7), end }
}

function currentEnd(frame: IntakeFrame, today: string) {
  return buildWindow(frame, undefined, today).end
}

function clampYear(requested: string | undefined, currentYear: number) {
  const year = Number(requested)
  if (!Number.isInteger(year) || year > currentYear || year < 1970) {
    return currentYear
  }
  return year
}

function lastDayOfMonth(year: number, month: number) {
  const next = month === 12 ? `${year + 1}-01-01` : `${year}-${pad(month + 1)}-01`
  return addDays(next, -1)
}

function keyFromMs(ms: number) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
  }).format(new Date(ms))
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}
