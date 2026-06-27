import {
  extractActiveCalories,
  extractDistanceKm,
  extractFloors,
  extractSteps,
  roundValue,
} from './google-health.normalize'

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

assert(extractSteps([{ steps: { countSum: '8421' } }]) === 8421, 'steps parse')
assert(extractFloors([{ floors: { countSum: '12' } }]) === 12, 'floors parse')
assert(
  roundValue(extractDistanceKm([{ distance: { millimetersSum: '2500000' } }]), 2) ===
    2.5,
  'distance parse'
)
assert(
  extractActiveCalories(
    [{ activeEnergyBurned: { energyKilocaloriesSum: '420' } }],
    [{ totalCalories: { energyKilocaloriesSum: '900' } }]
  ) === 420,
  'active calories preferred'
)
assert(
  extractActiveCalories(
    [{}],
    [{ totalCalories: { energyKilocaloriesSum: '900' } }]
  ) === 900,
  'total calories fallback'
)

console.log('google-health.normalize tests passed')
