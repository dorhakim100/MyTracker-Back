export type SetType = 'normal' | 'warmUp' | 'failure' | 'drop' | 'myoReps'

const TYPES: SetType[] = ['normal', 'warmUp', 'failure', 'drop', 'myoReps']

export function setTypeOf(
  set?: { type?: SetType | { expected?: SetType; actual?: SetType } },
  side: 'expected' | 'actual' = 'actual'
): SetType {
  const type = set?.type
  if (type && TYPES.includes(type as SetType)) return type as SetType
  if (type && typeof type === 'object') {
    const picked = type[side]
    if (picked && TYPES.includes(picked)) return picked
  }
  return 'normal'
}

export function isCountingType(type: SetType) {
  return type === 'normal' || type === 'failure'
}

export function countsInVolume(set?: {
  type?: SetType | { expected?: SetType; actual?: SetType }
}) {
  return setTypeOf(set) !== 'warmUp'
}
