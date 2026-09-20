import { Session } from '../session/session.model'
import { Set as SetModel, ISet } from '../set/set.model'
import { WorkoutService } from '../workout/workout.service'
import { Instructions } from '../instructions/instructions.model'
import { logger } from '../../services/logger.service'
import { Stats, IStats } from './stats.model'
import {
  average,
  setAccuracy,
  setActualRpe,
} from './stats.accuracy'
import {
  SessionPr,
  SessionStatsExercise,
  SessionStatsRecap,
} from './stats.types'

function setVolume(set: {
  weight?: { actual?: number }
  reps?: { actual?: number }
}) {
  return (set.weight?.actual ?? 0) * (set.reps?.actual ?? 0)
}

function setPlannedVolume(set: {
  weight?: { expected?: number }
  reps?: { expected?: number }
}) {
  return (set.weight?.expected ?? 0) * (set.reps?.expected ?? 0)
}

function durationMs(stats: IStats) {
  return stats.timeFrames.reduce((sum, frame) => {
    if (!frame.from || !frame.to) return sum
    const from = new Date(frame.from).getTime()
    const to = new Date(frame.to).getTime()
    if (Number.isNaN(from) || Number.isNaN(to) || to < from) return sum
    return sum + (to - from)
  }, 0)
}

export class StatsService {
  static async openFrame(sessionId: string, userId: string): Promise<IStats> {
    const session = await Session.findById(sessionId)
    if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 })

    let stats = await Stats.findOne({ sessionId })
    if (!stats) {
      stats = await Stats.create({
        sessionId,
        userId: userId || session.userId,
        timeFrames: [],
      })
      session.statsId = String(stats._id)
      await session.save()
    }

    const hasOpen = stats.timeFrames.some((frame) => !frame.to)
    if (!hasOpen) {
      stats.timeFrames.push({
        from: new Date().toISOString(),
        to: null,
      })
      await stats.save()
    }

    return stats
  }

  static async closeFrame(sessionId: string): Promise<IStats | null> {
    const stats = await Stats.findOne({ sessionId })
    if (!stats) return null

    const now = new Date().toISOString()
    let changed = false
    stats.timeFrames = stats.timeFrames.map((frame) => {
      if (frame.to) return frame
      changed = true
      return { from: frame.from, to: now }
    })
    if (changed) await stats.save()
    return stats
  }

  static async finish(sessionId: string, userId: string): Promise<SessionStatsRecap> {
    const existing = await Stats.findOne({ sessionId })
    if (!existing) {
      await this.openFrame(sessionId, userId)
    }
    await this.closeFrame(sessionId)
    return this.getRecap(sessionId)
  }

  static async getRecap(sessionId: string): Promise<SessionStatsRecap> {
    try {
      const session = await Session.findById(sessionId).lean()
      if (!session) {
        throw Object.assign(new Error('Session not found'), { statusCode: 404 })
      }

      const stats = await Stats.findOne({ sessionId })
      const sessionSets = await SetModel.find({ sessionId }).sort({
        exerciseId: 1,
        setNumber: 1,
      })
      const doneSets = sessionSets.filter((set) => set.isDone)

      const volumeActual = doneSets.reduce((sum, set) => sum + setVolume(set), 0)
      const volumePlanned = sessionSets.reduce(
        (sum, set) => sum + setPlannedVolume(set),
        0
      )

      const workoutDoc = session.workoutId
        ? await WorkoutService.getById(session.workoutId)
        : null
      const instructions = session.instructionsId
        ? await Instructions.findById(session.instructionsId).lean()
        : null

      const exerciseIds = [
        ...new Set(sessionSets.map((set) => set.exerciseId)),
      ]

      const skipAccuracyIds = new Set(
        (instructions?.exercises || [])
          .filter((exercise) => exercise.withoutExpected)
          .map((exercise) => exercise.exerciseId)
      )
      const accuracyDoneSets = doneSets.filter(
        (set) => !skipAccuracyIds.has(set.exerciseId)
      )

      const historyByExercise = await this.historyByExercise(
        session.userId,
        exerciseIds
      )

      const exercises: SessionStatsExercise[] = exerciseIds.map((exerciseId) => {
        const exerciseSets = sessionSets.filter(
          (set) => set.exerciseId === exerciseId
        )
        const exerciseDone = exerciseSets.filter((set) => set.isDone)
        const workoutEx = workoutDoc?.exercises?.find(
          (exercise: { exerciseId: string; name?: string; image?: string }) =>
            exercise.exerciseId === exerciseId
        )
        const instructionEx = instructions?.exercises?.find(
          (exercise) => exercise.exerciseId === exerciseId
        )
        const name = workoutEx?.name || instructionEx?.name || exerciseId
        const image = workoutEx?.image || instructionEx?.image

        return {
          exerciseId,
          name,
          image,
          actualRpe: average(exerciseDone.map(setActualRpe)),
          accuracy: skipAccuracyIds.has(exerciseId)
            ? null
            : average(exerciseDone.map(setAccuracy)),
          prs: this.prsForExercise(
            exerciseId,
            name,
            sessionId,
            exerciseDone,
            historyByExercise.get(exerciseId) || []
          ),
        }
      })

      const vsLastPercent = await this.vsLastPercent(
        session.userId,
        session.workoutId,
        session.date,
        volumeActual
      )

      return {
        durationMs: stats ? durationMs(stats) : 0,
        actualRpe: average(doneSets.map(setActualRpe)),
        accuracy: average(accuracyDoneSets.map(setAccuracy)),
        volumeActual,
        volumePlanned,
        setsDone: doneSets.length,
        setsPlanned: sessionSets.length,
        vsLastPercent,
        exercises,
      }
    } catch (err) {
      logger.error(`StatsService.getRecap failed for ${sessionId}`, err)
      throw err
    }
  }

  private static async historyByExercise(userId: string, exerciseIds: string[]) {
    const map = new Map<string, ISet[]>()
    if (!exerciseIds.length) return map

    const history = await SetModel.find({
      userId,
      exerciseId: { $in: exerciseIds },
      isDone: true,
    })

    for (const set of history) {
      const list = map.get(set.exerciseId) || []
      list.push(set)
      map.set(set.exerciseId, list)
    }
    return map
  }

  private static prsForExercise(
    exerciseId: string,
    name: string,
    sessionId: string,
    sessionDone: ISet[],
    history: ISet[]
  ): SessionPr[] {
    const prs: SessionPr[] = []
    if (!sessionDone.length) return prs

    const heaviest = history.reduce((best, set) => {
      const weight = set.weight?.actual ?? 0
      const bestWeight = best?.weight?.actual ?? -1
      return weight > bestWeight ? set : best
    }, history[0])

    if (heaviest && heaviest.sessionId === sessionId) {
      const previous = history
        .filter((set) => set.sessionId !== sessionId)
        .reduce((max, set) => Math.max(max, set.weight?.actual ?? 0), 0)
      prs.push({
        type: 'weight',
        exerciseId,
        name,
        current: heaviest.weight?.actual ?? 0,
        previous: previous || undefined,
      })
    }

    const bestVolumeSet = history.reduce((best, set) => {
      const volume = setVolume(set)
      const bestVolume = best ? setVolume(best) : -1
      return volume > bestVolume ? set : best
    }, history[0])

    if (bestVolumeSet && bestVolumeSet.sessionId === sessionId) {
      const previous = history
        .filter((set) => set.sessionId !== sessionId)
        .reduce((max, set) => Math.max(max, setVolume(set)), 0)
      prs.push({
        type: 'volume',
        exerciseId,
        name,
        current: setVolume(bestVolumeSet),
        previous: previous || undefined,
      })
    }

    return prs
  }

  private static async vsLastPercent(
    userId: string,
    workoutId: string | null | undefined,
    date: string,
    volumeActual: number
  ): Promise<number | null> {
    if (!workoutId) return null

    const previous = await Session.findOne({
      userId,
      workoutId,
      date: { $lt: date },
    }).sort({ date: -1 })

    if (!previous?._id) return null

    const previousSets = await SetModel.find({
      sessionId: previous._id.toString(),
      isDone: true,
    })
    const lastVolume = previousSets.reduce((sum, set) => sum + setVolume(set), 0)
    if (!lastVolume) return null
    return (volumeActual / lastVolume) * 100
  }
}
