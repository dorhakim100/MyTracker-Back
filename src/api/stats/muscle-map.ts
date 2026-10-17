// Explorer filters that are not chart groups: Forearms, Hip Adductors.
// Lats, Upper Back, and Lower Back fold into back.
// Rear delts are their own group, between shoulders and back.
// Exercise documents are not rewritten.

export const MUSCLE_GROUP_IDS = [
  'chest',
  'shoulders',
  'rearDelts',
  'back',
  'biceps',
  'triceps',
  'abs',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
] as const

export type MuscleGroupId = (typeof MUSCLE_GROUP_IDS)[number]

const ALIASES: Record<string, MuscleGroupId> = {
  chest: 'chest',
  pectorals: 'chest',
  pecs: 'chest',
  pec: 'chest',
  pectoral: 'chest',
  pectoralis: 'chest',
  'upper chest': 'chest',
  'lower chest': 'chest',

  shoulders: 'shoulders',
  shoulder: 'shoulders',
  delts: 'shoulders',
  delt: 'shoulders',
  deltoids: 'shoulders',
  deltoid: 'shoulders',
  'anterior delts': 'shoulders',
  'anterior delt': 'shoulders',
  'front delts': 'shoulders',
  'front delt': 'shoulders',
  'lateral delts': 'shoulders',
  'lateral delt': 'shoulders',
  'side delts': 'shoulders',
  'side delt': 'shoulders',

  'rear delts': 'rearDelts',
  'rear delt': 'rearDelts',
  'rear deltoid': 'rearDelts',
  'rear deltoids': 'rearDelts',
  'posterior delts': 'rearDelts',
  'posterior delt': 'rearDelts',
  'posterior deltoid': 'rearDelts',
  'posterior deltoids': 'rearDelts',

  triceps: 'triceps',
  tricep: 'triceps',

  back: 'back',
  lats: 'back',
  lat: 'back',
  latissimus: 'back',
  'latissimus dorsi': 'back',
  'upper back': 'back',
  'lower back': 'back',
  traps: 'back',
  trapezius: 'back',
  rhomboids: 'back',
  rhomboid: 'back',
  'erector spinae': 'back',
  lumbar: 'back',

  biceps: 'biceps',
  bicep: 'biceps',
  brachialis: 'biceps',

  quads: 'quads',
  quad: 'quads',
  quadriceps: 'quads',

  glutes: 'glutes',
  glute: 'glutes',
  gluteus: 'glutes',
  butt: 'glutes',

  calves: 'calves',
  calf: 'calves',
  gastrocnemius: 'calves',
  soleus: 'calves',

  hamstrings: 'hamstrings',
  hamstring: 'hamstrings',

  abs: 'abs',
  abdominals: 'abs',
  core: 'abs',
  obliques: 'abs',
  oblique: 'abs',
  serratus: 'abs',
  'lower abs': 'abs',
}

function normalizeMuscle(value: string) {
  return value.toLowerCase().trim().replace(/-/g, ' ').replace(/\s+/g, ' ')
}

export function groupsForMuscles(muscles?: string[]) {
  const groups = new Set<MuscleGroupId>()
  for (const muscle of muscles || []) {
    const group = ALIASES[normalizeMuscle(muscle)]
    if (group) groups.add(group)
  }
  return [...groups]
}

function hasTraps(muscles: string[]) {
  return muscles.some((muscle) => {
    const key = normalizeMuscle(muscle)
    return key === 'traps' || key === 'trap' || key.includes('trapezius')
  })
}

function hasRhomboids(muscles: string[]) {
  return muscles.some((muscle) => {
    const key = normalizeMuscle(muscle)
    return key.includes('rhomboid') || key.includes('romboid')
  })
}

// Catalog rows never store "rear delts" as a main muscle. They store "delts",
// and the badges treat that as rear delts when traps and rhomboids are secondary.
export function chartGroupsForExercise(exercise: {
  mainMuscles?: string[]
  secondaryMuscles?: string[]
}): MuscleGroupId[] {
  const groups = groupsForMuscles(exercise.mainMuscles)
  const secondary = exercise.secondaryMuscles || []
  const isRearDelt =
    groups.includes('shoulders') && hasTraps(secondary) && hasRhomboids(secondary)
  if (!isRearDelt) return groups

  const withoutShoulders = groups.filter((id) => id !== 'shoulders')
  if (withoutShoulders.includes('rearDelts')) return withoutShoulders
  return [...withoutShoulders, 'rearDelts']
}
