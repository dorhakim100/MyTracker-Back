import mongoose from 'mongoose'
import { Session } from '../session/session.model'
import { Workout } from '../workout/workout.model'
import { Instructions } from '../instructions/instructions.model'
import { sessionIsraelDate } from '../../utils/israel-date.util'

export function asId(value: unknown) {
  return value ? String(value) : ''
}

export function objectIds(ids: string[]) {
  return ids.filter((id) => mongoose.isValidObjectId(id))
}

export async function sessionsForUser(forUserId: string, dates: string[] | null) {
  const sessions = await Session.find({ userId: forUserId }).select(
    'date workoutId instructionsId statsId exercises'
  )
  const allowed = dates ? new Set(dates) : null

  return sessions.filter((session) => {
    const key = sessionIsraelDate(session.date || '')
    if (!key) return false
    if (!allowed) return true
    return allowed.has(key)
  })
}

export async function workoutsByIds(ids: string[]) {
  const valid = objectIds(ids)
  if (!valid.length) return new Map<string, { isActive: boolean; isEmpty?: boolean; name: string }>()

  const workouts = await Workout.find({ _id: { $in: valid } }).select(
    'name isActive isEmpty'
  )
  return new Map(
    workouts.map((workout) => [
      asId(workout._id),
      {
        name: workout.name,
        isActive: Boolean(workout.isActive),
        isEmpty: Boolean(workout.isEmpty),
      },
    ])
  )
}

export async function finishedInstructionIds(ids: string[]) {
  const valid = objectIds(ids)
  if (!valid.length) return new Set<string>()

  const instructions = await Instructions.find({
    _id: { $in: valid },
    isFinished: true,
  }).select('_id')

  return new Set(instructions.map((instruction) => asId(instruction._id)))
}

export function isFinishedSession(
  session: { statsId?: string | null; instructionsId?: string | null },
  finishedInstructions: Set<string>
) {
  if (session.statsId) return true
  if (!session.instructionsId) return false
  return finishedInstructions.has(session.instructionsId)
}

export function isActiveRoutine(
  workoutId: string | null | undefined,
  workouts: Map<string, { isActive: boolean; isEmpty?: boolean }>
) {
  if (!workoutId) return false
  const workout = workouts.get(workoutId)
  return Boolean(workout && workout.isActive && !workout.isEmpty)
}
