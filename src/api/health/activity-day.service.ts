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
}

async function upsertDays(
  userId: string,
  vendor: ActivityVendor,
  days: ActivityDayInput[]
) {
  if (!days.length) return

  await ActivityDay.bulkWrite(
    days.map((day) => ({
      updateOne: {
        filter: { userId, date: day.date, vendor },
        update: {
          $set: {
            userId,
            date: day.date,
            vendor,
            steps: Math.round(day.steps) || 0,
            calories: Math.round(day.calories) || 0,
          },
        },
        upsert: true,
      },
    }))
  )
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
