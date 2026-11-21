export type SetType = 'normal' | 'warmUp' | 'failure' | 'drop' | 'myoReps'

const TYPES: SetType[] = ['normal', 'warmUp', 'failure', 'drop', 'myoReps']

export function setTypeOf(set?: { type?: string }): SetType {
  if (set?.type && TYPES.includes(set.type as SetType)) return set.type as SetType
  return 'normal'
}

export function isCountingType(type: SetType) {
  return type === 'normal' || type === 'failure'
}

export function countsInVolume(set?: { type?: string }) {
  return setTypeOf(set) !== 'warmUp'
}
