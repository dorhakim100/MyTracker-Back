import {
  DEFAULT_DAILY_STEPS_GOAL,
  applyDailyStepsGoalUpdate,
  normalizeDailyStepsGoal,
  normalizeUserDetails,
} from './user-details.util'

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

const baseDetails = {
  fullname: 'Test User',
  imgUrl: 'https://example.com/avatar.png',
  birthdate: 946684800000,
  height: 170,
  gender: 'male',
  activity: 'sedentary',
}

assert(
  normalizeDailyStepsGoal(DEFAULT_DAILY_STEPS_GOAL) === 10_000,
  'default goal should normalize to 10000'
)

assert(
  normalizeDailyStepsGoal('12500.6') === 12_501,
  'string values should round to integers'
)

try {
  normalizeDailyStepsGoal(500)
  throw new Error('expected validation error for low goal')
} catch (err) {
  assert(
    err instanceof Error && err.message.includes('dailyStepsGoal'),
    'low goal should throw validation error'
  )
}

try {
  normalizeDailyStepsGoal(Number.NaN)
  throw new Error('expected validation error for NaN')
} catch (err) {
  assert(
    err instanceof Error && err.message.includes('dailyStepsGoal'),
    'NaN should throw validation error'
  )
}

const normalized = normalizeUserDetails(baseDetails)
assert(
  normalized.dailyStepsGoal === DEFAULT_DAILY_STEPS_GOAL,
  'missing dailyStepsGoal should default to 10000'
)

const merged = applyDailyStepsGoalUpdate(baseDetails, { dailyStepsGoal: 12_000 })
assert(
  merged.dailyStepsGoal === 12_000 && merged.fullname === 'Test User',
  'update should merge dailyStepsGoal into existing details'
)

const preserved = applyDailyStepsGoalUpdate(
  { ...baseDetails, dailyStepsGoal: 8_000 },
  { fullname: 'Updated Name' }
)
assert(
  preserved.fullname === 'Updated Name' && preserved.dailyStepsGoal === 8_000,
  'partial update without goal should preserve existing goal'
)

console.log('user-details.util tests passed')
