import { ExerciseModel } from '../exercise/exercise.model'
import { Instructions } from '../instructions/instructions.model'
import { Set as SetModel } from '../set/set.model'
import { Workout } from '../workout/workout.model'
import {
  datesFor,
  israelToday,
  sessionIsraelDate,
  WeekMode,
} from '../../utils/israel-date.util'
import {
  asId,
  finishedInstructionIds,
  isFinishedSession,
  isNonEmptyRoutine,
  sessionsForUser,
  workoutsByIds,
} from './stats.sessions'

export interface WeekRecord {
  type: 'weight' | 'volume'
  exerciseId: string
  name: string
  image?: string
  current: number
  sessionDate: string
}

function setVolume(set: { weight?: { actual?: number }; reps?: { actual?: number } }) {
  return (set.weight?.actual ?? 0) * (set.reps?.actual ?? 0)
}

async function weeklyTarget(forUserId: string) {
  const active = await Workout.find({
    forUserId,
    isActive: true,
    isEmpty: { $ne: true },
  }).select('_id')

  const workoutIds = active.map((workout) => asId(workout._id))
  if (!workoutIds.length) return 0

  const instructions = await Instructions.find({
    workoutId: { $in: workoutIds },
  }).select('workoutId timesPerWeek weekNumber isDone')

  const byWorkout = new Map<string, typeof instructions>()
  for (const instruction of instructions) {
    const list = byWorkout.get(instruction.workoutId) || []
    list.push(instruction)
    byWorkout.set(instruction.workoutId, list)
  }

  let target = 0
  for (const list of byWorkout.values()) {
    const open = list
      .filter((instruction) => !instruction.isDone)
      .sort((a, b) => a.weekNumber - b.weekNumber)[0]
    const latest = [...list].sort((a, b) => b.weekNumber - a.weekNumber)[0]
    target += (open || latest)?.timesPerWeek || 0
  }
  return target
}

async function recordsFor(
  forUserId: string,
  sessions: { _id: unknown; date?: string; exercises?: { exerciseId?: string; name?: string; image?: string }[] }[]
) {
  const sessionIds = new Set(sessions.map((session) => asId(session._id)))
  if (!sessionIds.size) return []

  const windowSets = await SetModel.find({
    sessionId: { $in: [...sessionIds] },
    isDone: true,
  }).select('exerciseId')

  const exerciseIds = [
    ...new Set(windowSets.map((set) => set.exerciseId).filter(Boolean)),
  ]
  if (!exerciseIds.length) return []

  const history = await SetModel.find({
    userId: forUserId,
    exerciseId: { $in: exerciseIds },
    isDone: true,
  }).select('exerciseId sessionId weight reps')

  const catalog = await ExerciseModel.find({
    exerciseId: { $in: exerciseIds },
  }).select('exerciseId name image')

  const catalogById = new Map(
    catalog.map((exercise) => [exercise.exerciseId, exercise])
  )
  const sessionById = new Map(sessions.map((session) => [asId(session._id), session]))

  const byExercise = new Map<string, typeof history>()
  for (const set of history) {
    const list = byExercise.get(set.exerciseId) || []
    list.push(set)
    byExercise.set(set.exerciseId, list)
  }

  const records: WeekRecord[] = []

  for (const exerciseId of exerciseIds) {
    const sets = byExercise.get(exerciseId) || []
    if (!sets.length) continue

    const snapshot = sessions
      .flatMap((session) => session.exercises || [])
      .find((exercise) => exercise.exerciseId === exerciseId)
    const known = catalogById.get(exerciseId)
    const name = known?.name || snapshot?.name || exerciseId
    const image = known?.image || snapshot?.image

    const heaviest = sets.reduce((best, set) => {
      const weight = set.weight?.actual ?? 0
      const bestWeight = best.weight?.actual ?? -1
      return weight > bestWeight ? set : best
    }, sets[0])

    if (sessionIds.has(heaviest.sessionId)) {
      records.push({
        type: 'weight',
        exerciseId,
        name,
        image,
        current: heaviest.weight?.actual ?? 0,
        sessionDate: sessionIsraelDate(
          sessionById.get(heaviest.sessionId)?.date || ''
        ),
      })
    }

    const fullest = sets.reduce((best, set) => {
      return setVolume(set) > setVolume(best) ? set : best
    }, sets[0])

    if (sessionIds.has(fullest.sessionId)) {
      records.push({
        type: 'volume',
        exerciseId,
        name,
        image,
        current: setVolume(fullest),
        sessionDate: sessionIsraelDate(
          sessionById.get(fullest.sessionId)?.date || ''
        ),
      })
    }
  }

  return records.sort((a, b) => {
    if (a.sessionDate !== b.sessionDate) return a.sessionDate < b.sessionDate ? 1 : -1
    if (a.name !== b.name) return a.name.localeCompare(b.name)
    return a.type.localeCompare(b.type)
  })
}

export async function buildWeekSummary(forUserId: string, mode: WeekMode) {
  const dates = datesFor(mode) || []
  const today = israelToday()
  const sessions = await sessionsForUser(forUserId, dates)
  const workoutIds = sessions
    .map((session) => session.workoutId)
    .filter((id): id is string => Boolean(id))
  const workouts = await workoutsByIds(workoutIds)
  const finished = await finishedInstructionIds(
    sessions
      .map((session) => session.instructionsId)
      .filter((id): id is string => Boolean(id))
  )

  const counted = sessions.filter(
    (session) =>
      isFinishedSession(session, finished) &&
      isNonEmptyRoutine(session.workoutId, workouts)
  )
  const marked = new Set(counted.map((session) => sessionIsraelDate(session.date)))

  const days = dates.map((date) => ({
    date,
    isToday: date === today,
    isFuture: date > today,
    hasWorkout: marked.has(date),
  }))

  const target = await weeklyTarget(forUserId)
  const records = await recordsFor(forUserId, sessions)

  return {
    mode,
    days,
    done: counted.length,
    target,
    records: records.map((record) => ({
      type: record.type,
      exerciseId: record.exerciseId,
      name: record.name,
      image: record.image,
      current: record.current,
    })),
  }
}
