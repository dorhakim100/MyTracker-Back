export type PrType = 'weight' | 'volume'

const RIR_TO_RPE: Record<number, number> = {
  0: 9.4,
  1: 8.25,
  2: 7.75,
  3: 7,
  4: 6.5,
  5: 5.5,
}

const JUMPS_TO_ZERO = 4

export function rirToRpe(rir: number): number | null {
  if (rir > 5) return null
  if (rir in RIR_TO_RPE) return RIR_TO_RPE[rir]
  return null
}

export function setActualRpe(set: {
  rpe?: { actual?: number }
  rir?: { actual?: number }
}): number | null {
  if (set.rpe?.actual != null) return set.rpe.actual
  if (set.rir?.actual != null) return rirToRpe(set.rir.actual)
  return null
}

export function setExpectedRpe(set: {
  rpe?: { expected?: number }
  rir?: { expected?: number }
}): number | null {
  if (set.rpe?.expected != null) return set.rpe.expected
  if (set.rir?.expected != null) return rirToRpe(set.rir.expected)
  return null
}

export function weightJumpSize(plannedKg: number): number {
  if (plannedKg <= 10) return 1
  if (plannedKg <= 25) return 2
  if (plannedKg <= 40) return 2.5
  if (plannedKg <= 70) return 3
  if (plannedKg <= 110) return 3.5
  if (plannedKg <= 150) return 4
  if (plannedKg <= 200) return 4.5
  if (plannedKg <= 250) return 5
  if (plannedKg <= 300) return 5.5
  return 6
}

function sliceScore(jumps: number): number {
  return Math.max(0, 1 - jumps / JUMPS_TO_ZERO)
}

export function setAccuracy(set: {
  weight: { expected?: number; actual?: number }
  reps: { expected?: number; actual?: number }
  rpe?: { expected?: number; actual?: number }
  rir?: { expected?: number; actual?: number }
}): number | null {
  const parts: { weight: number; score: number }[] = []

  const expectedRpe = setExpectedRpe(set)
  const actualRpe = setActualRpe(set)
  if (expectedRpe != null && actualRpe != null) {
    parts.push({
      weight: 0.4,
      score: sliceScore(Math.abs(actualRpe - expectedRpe)),
    })
  }

  const expectedWeight = set.weight?.expected
  const actualWeight = set.weight?.actual
  if (expectedWeight != null && actualWeight != null && expectedWeight > 0) {
    const jumps =
      Math.abs(actualWeight - expectedWeight) / weightJumpSize(expectedWeight)
    parts.push({ weight: 0.4, score: sliceScore(jumps) })
  }

  const expectedReps = set.reps?.expected
  const actualReps = set.reps?.actual
  if (expectedReps != null && actualReps != null) {
    parts.push({
      weight: 0.2,
      score: sliceScore(Math.abs(actualReps - expectedReps)),
    })
  }

  if (!parts.length) return null

  const totalWeight = parts.reduce((sum, part) => sum + part.weight, 0)
  const weighted = parts.reduce(
    (sum, part) => sum + part.score * part.weight,
    0
  )
  return (weighted / totalWeight) * 100
}

export function average(values: (number | null | undefined)[]): number | null {
  const nums = values.filter((value): value is number => value != null)
  if (!nums.length) return null
  return nums.reduce((sum, value) => sum + value, 0) / nums.length
}
