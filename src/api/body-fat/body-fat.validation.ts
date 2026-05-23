
const MIN_BODY_FAT = 3
const MAX_BODY_FAT = 60

export function clampBodyFatRange(
  minPercent: number,
  maxPercent: number
): { minPercent: number; maxPercent: number } {
  let min = Math.min(minPercent, maxPercent)
  let max = Math.max(minPercent, maxPercent)

  min = Math.max(MIN_BODY_FAT, Math.min(MAX_BODY_FAT, min))
  max = Math.max(MIN_BODY_FAT, Math.min(MAX_BODY_FAT, max))

  if (min > max) {
    min = MIN_BODY_FAT
    max = MAX_BODY_FAT
  }

  return { minPercent: min, maxPercent: max }
}
