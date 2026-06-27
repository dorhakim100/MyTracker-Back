export const DEFAULT_DAILY_STEPS_GOAL = 10_000
export const MIN_DAILY_STEPS_GOAL = 1_000
export const MAX_DAILY_STEPS_GOAL = 100_000

export type UserDetailsFields = {
  fullname: string
  imgUrl: string
  birthdate: number
  height: number
  gender: string
  activity: string
  dailyStepsGoal?: number
}

export function normalizeDailyStepsGoal(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value)

  if (!Number.isFinite(parsed)) {
    throw new Error('dailyStepsGoal must be a number')
  }

  const rounded = Math.round(parsed)

  if (rounded < MIN_DAILY_STEPS_GOAL || rounded > MAX_DAILY_STEPS_GOAL) {
    throw new Error(
      `dailyStepsGoal must be between ${MIN_DAILY_STEPS_GOAL} and ${MAX_DAILY_STEPS_GOAL}`
    )
  }

  return rounded
}

export function normalizeUserDetails(
  details: UserDetailsFields
): UserDetailsFields {
  return {
    ...details,
    dailyStepsGoal: normalizeDailyStepsGoal(
      details.dailyStepsGoal ?? DEFAULT_DAILY_STEPS_GOAL
    ),
  }
}

export function applyDailyStepsGoalUpdate(
  existingDetails: UserDetailsFields,
  incomingDetails: Partial<UserDetailsFields>
): UserDetailsFields {
  if (incomingDetails.dailyStepsGoal === undefined) {
    return {
      ...existingDetails,
      ...incomingDetails,
      dailyStepsGoal: normalizeDailyStepsGoal(
        existingDetails.dailyStepsGoal ?? DEFAULT_DAILY_STEPS_GOAL
      ),
    }
  }

  return {
    ...existingDetails,
    ...incomingDetails,
    dailyStepsGoal: normalizeDailyStepsGoal(incomingDetails.dailyStepsGoal),
  }
}
