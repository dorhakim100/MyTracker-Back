import { ExerciseModel } from '../exercise/exercise.model'
import { Set as SetModel } from '../set/set.model'
import {
  datesFor,
  DistributionTimeframe,
  israelToday,
  previousDatesFor,
  sessionIsraelDate,
} from '../../utils/israel-date.util'
import {
  chartGroupsForExercise,
  MUSCLE_GROUP_IDS,
  MuscleGroupId,
} from './muscle-map'
import { asId, sessionsForUser, workoutsByIds } from './stats.sessions'

interface ExerciseRow {
  exerciseId: string
  name: string
  image?: string
  sets: number
  volume: number
}

interface RoutineRow {
  id: string
  name: string
}

interface GroupBucket {
  id: MuscleGroupId
  sets: number
  volume: number
  routines: Map<string, RoutineRow>
  exercises: Map<string, ExerciseRow>
}

function setVolume(set: {
  weight?: { actual?: number }
  reps?: { actual?: number }
}) {
  return (set.weight?.actual ?? 0) * (set.reps?.actual ?? 0)
}

function emptyGroups() {
  return MUSCLE_GROUP_IDS.map((id) => ({
    id,
    sets: 0,
    volume: 0,
    routines: new Map<string, RoutineRow>(),
    exercises: new Map<string, ExerciseRow>(),
  }))
}

function addExercise(
  bucket: Map<string, ExerciseRow>,
  exerciseId: string,
  name: string,
  image: string | undefined,
  volume: number
) {
  const current = bucket.get(exerciseId)
  if (!current) {
    bucket.set(exerciseId, { exerciseId, name, image, sets: 1, volume })
    return
  }
  current.sets += 1
  current.volume += volume
}

function publish(groups: GroupBucket[], withLists: boolean) {
  return groups.map((group) => ({
    id: group.id,
    sets: group.sets,
    volume: group.volume,
    routineCount: group.routines.size,
    exerciseCount: group.exercises.size,
    routines: withLists
      ? [...group.routines.values()].sort(
          (a, b) => a?.name?.localeCompare(b?.name) ?? 0
        )
      : [],
    exercises: withLists
      ? [...group.exercises.values()].sort(
          (a, b) => b.sets - a.sets || a.name.localeCompare(b.name)
        )
      : [],
  }))
}

async function aggregate(
  forUserId: string,
  dates: string[] | null,
  withLists: boolean
) {
  const today = israelToday()
  const sessions = (await sessionsForUser(forUserId, dates)).filter(
    (session) => sessionIsraelDate(session.date || '') <= today
  )
  const sessionIds = sessions.map((session) => asId(session._id))
  const sets = sessionIds.length
    ? await SetModel.find({ sessionId: { $in: sessionIds }, isDone: true })
    : []

  const exerciseIds = [
    ...new Set(sets.map((set) => set.exerciseId).filter(Boolean)),
  ]
  const catalog = exerciseIds.length
    ? await ExerciseModel.find({ exerciseId: { $in: exerciseIds } }).select(
        'exerciseId name image mainMuscles secondaryMuscles'
      )
    : []
  const catalogById = new Map(
    catalog.map((exercise) => [exercise.exerciseId, exercise])
  )

  const workoutIds = sessions
    .map((session) => session.workoutId)
    .filter((id): id is string => Boolean(id))
  const workouts = await workoutsByIds(workoutIds)
  const sessionById = new Map(
    sessions.map((session) => [asId(session._id), session])
  )

  const groups = emptyGroups()
  const groupById = new Map(groups.map((group) => [group.id, group]))
  const total = {
    sets: 0,
    volume: 0,
    routines: new Map<string, RoutineRow>(),
    exercises: new Map<string, ExerciseRow>(),
  }
  const seen = new Set<string>()

  for (const set of sets) {
    const exercise = catalogById.get(set.exerciseId)
    if (!exercise) continue
    const hit = chartGroupsForExercise(exercise)
    if (!hit.length) continue

    const volume = setVolume(set)
    const session = sessionById.get(set.sessionId)
    const workout = session?.workoutId
      ? workouts.get(session.workoutId)
      : undefined
    const routine =
      workout && !workout.isEmpty
        ? { id: session?.workoutId || '', name: workout.name }
        : null
    const name = exercise.name || set.exerciseId
    const image = exercise.image || undefined
    const setId = asId(set._id)

    if (!seen.has(setId)) {
      seen.add(setId)
      total.sets += 1
      total.volume += volume
      if (routine?.id) total.routines.set(routine.id, routine)
      addExercise(total.exercises, set.exerciseId, name, image, volume)
    }

    for (const id of hit) {
      const group = groupById.get(id)
      if (!group) continue
      group.sets += 1
      group.volume += volume
      if (routine?.id) group.routines.set(routine.id, routine)
      addExercise(group.exercises, set.exerciseId, name, image, volume)
    }
  }

  return {
    groups: publish(groups, withLists),
    total: {
      sets: total.sets,
      volume: total.volume,
      routineCount: total.routines.size,
      exerciseCount: total.exercises.size,
      routines: withLists
        ? [...total.routines.values()].sort(
            (a, b) => a?.name?.localeCompare(b?.name) ?? 0
          )
        : [],
      exercises: withLists
        ? [...total.exercises.values()].sort(
            (a, b) => b.sets - a.sets || a.name.localeCompare(b.name)
          )
        : [],
    },
  }
}

function numbersOnly(summary: Awaited<ReturnType<typeof aggregate>>) {
  return {
    groups: summary.groups.map((group) => ({
      id: group.id,
      sets: group.sets,
      volume: group.volume,
      routineCount: group.routineCount,
      exerciseCount: group.exerciseCount,
    })),
    total: {
      sets: summary.total.sets,
      volume: summary.total.volume,
      routineCount: summary.total.routineCount,
      exerciseCount: summary.total.exerciseCount,
    },
  }
}

export async function buildDistribution(
  forUserId: string,
  timeframe: DistributionTimeframe,
  includePrevious: boolean
) {
  const dates = datesFor(timeframe)
  const current = await aggregate(forUserId, dates, true)

  let previous = null
  if (includePrevious && timeframe !== 'all') {
    const earlier = previousDatesFor(timeframe)
    if (earlier) {
      previous = numbersOnly(await aggregate(forUserId, earlier, false))
    }
  }

  return {
    timeframe,
    groups: current.groups,
    total: current.total,
    previous,
  }
}
