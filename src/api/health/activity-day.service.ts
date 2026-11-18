import { logger } from '../../services/logger.service'
import { ActivityDay, type ActivityVendor } from './activity-day.model'

export type ActivityDayInput = {
  date: string
  steps: number
  calories: number
}

export const ActivityDayService = {
  upsertDays,
  findInRange,
  hasAnyInRange,
  ensureActivityDayIndex,
}

async function upsertDays(
  userId: string,
  vendor: ActivityVendor,
  days: ActivityDayInput[]
) {
  if (!days.length) return

  const existing = await ActivityDay.find({
    userId,
    date: { $in: days.map((day) => day.date) },
  })
    .select('_id date vendor')
    .lean()

  const byDate = new Map<string, typeof existing>()
  for (const row of existing) {
    const group = byDate.get(row.date) ?? []
    group.push(row)
    byDate.set(row.date, group)
  }

  const ops: Parameters<typeof ActivityDay.bulkWrite>[0] = []

  for (const day of days) {
    const steps = Math.round(day.steps) || 0
    const calories = Math.round(day.calories) || 0
    const rows = byDate.get(day.date) ?? []
    const keep = rows.find((row) => row.vendor === vendor) ?? rows[0]

    if (!keep) {
      ops.push({
        insertOne: {
          document: { userId, date: day.date, vendor, steps, calories },
        },
      })
      continue
    }

    for (const row of rows) {
      if (String(row._id) === String(keep._id)) continue
      ops.push({ deleteOne: { filter: { _id: row._id } } })
    }

    ops.push({
      updateOne: {
        filter: { _id: keep._id },
        update: { $set: { vendor, steps, calories } },
      },
    })
  }

  if (ops.length) await ActivityDay.bulkWrite(ops)
}

async function ensureActivityDayIndex() {
  const duplicates = await ActivityDay.aggregate<{ _id: string }>([
    {
      $group: {
        _id: { userId: '$userId', date: '$date' },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1 },
  ])
  if (duplicates.length) return

  try {
    await ActivityDay.syncIndexes()
  } catch (err) {
    logger.error('Failed to sync activity day index', err)
  }
}

async function findInRange(userId: string, start: string, end: string) {
  return ActivityDay.find({
    userId,
    date: { $gte: start, $lte: end },
  }).lean()
}

async function hasAnyInRange(userId: string, start: string, end: string) {
  const found = await ActivityDay.exists({
    userId,
    date: { $gte: start, $lte: end },
  })
  return Boolean(found)
}
