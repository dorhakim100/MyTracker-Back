import { Instructions, IInstructions } from './instructions.model'
import { logger } from '../../services/logger.service'
import { SessionService } from '../session/session.service'
import { setTypeOf } from '../set/set-type'

export class InstructionsService {
  static getEmptyInstructions(workoutId: string) {
    return {
      workoutId,
      exercises: [],
      isDone: false,
      doneTimes: 0,
      isFinished: false,
      isEmpty: true,
      weekNumber: 1,
    }
  }
  /**
   * Ensures RPE and RIR are mutually exclusive in instruction sets.
   * If RIR has a value, RPE should be undefined.
   * If RPE has a value, RIR should be undefined.
   */
  private static sanitizeInstructionSets(
    instruction: Partial<IInstructions>
  ): Partial<IInstructions> {
    if (!instruction.exercises) {
      return instruction
    }

    const sanitized = { ...instruction }
    sanitized.exercises = instruction.exercises.map((exercise) => {
      if (!exercise.sets) {
        return exercise
      }

      return {
        ...exercise,
        sets: exercise.sets.map((set: any) => {
          const setData: any = { ...set }

          // Check if RIR has a value (expected or actual)
          const hasRir = set.rir?.expected != null || set.rir?.actual != null

          // Check if RPE has a value (expected or actual)
          const hasRpe = set.rpe?.expected != null || set.rpe?.actual != null

          if (hasRir) {
            // If RIR exists, remove RPE
            delete setData.rpe
          } else if (hasRpe) {
            // If RPE exists, remove RIR
            delete setData.rir
          } else {
            // If neither has a value, remove both
            delete setData.rpe
            delete setData.rir
          }

          return setData
        }),
      }
    })

    return sanitized
  }
  static async query(filterBy = {}) {
    try {
      const instructions = await Instructions.find(filterBy)
      return instructions
    } catch (err) {
      logger.error('Failed to query instructions', err)
      throw err
    }
  }

  static async getByWorkoutId(filter: {
    workoutId: string
    weekNumber: number
    // forUserId: string
  }) {
    try {
      let instructions
      instructions = await Instructions.findOne({ ...filter })

      if (!instructions) {
        instructions = await Instructions.findOne({
          workoutId: filter.workoutId,
        }).sort({ weekNumber: -1 })

        if (!instructions) {
          return await Instructions.create({ ...filter, exercises: [] })
        } else {
          // Convert Mongoose document to plain object and exclude _id
          const instructionsObj = instructions.toObject()
          const { _id, ...instructionsWithoutId } = instructionsObj
          const newInstruction = {
            ...instructionsWithoutId,
            weekNumber: filter.weekNumber,
            timesPerWeek: instructionsObj.timesPerWeek,
            doneTimes: 0,
            isDone: false,
          }
          const sanitizedInstruction =
            this.sanitizeInstructionSets(newInstruction)
          return await Instructions.create(sanitizedInstruction)
        }
      }
      return instructions
    } catch (err) {
      logger.error(
        `Failed to get instructions by workout id ${filter.workoutId}`,
        err
      )
      throw err
    }
  }
  static async loadForPlay(workoutId: string) {
    try {
      const instruction = await Instructions.findOne({
        workoutId,
        isDone: false,
      }).lean()

      if (!instruction) return null

      const doneTimes = (instruction.doneTimes || 0) + 1
      const isDone = doneTimes >= (instruction.timesPerWeek || 1)

      return {
        ...instruction,
        doneTimes,
        isDone,
        isFinished: false,
        exercises: this.playedExercises(instruction.exercises || []),
      }
    } catch (err) {
      logger.error(`Failed to load instructions for play ${workoutId}`, err)
      throw err
    }
  }

  static async markPlayed(instruction: {
    _id: unknown
    doneTimes: number
    isDone: boolean
  }) {
    await Instructions.updateOne(
      { _id: instruction._id },
      {
        doneTimes: instruction.doneTimes,
        isDone: instruction.isDone,
        isFinished: false,
      }
    )
  }

  static async savePlayedExercises(
    instructionId: unknown,
    exercises: { exerciseId?: string; sets?: unknown[] }[]
  ) {
    await Instructions.updateOne(
      {
        _id: instructionId,
        exercises: { $not: { $elemMatch: { 'sets.isDone': true } } },
      },
      { exercises }
    )
  }

  private static playedExercises(exercises: any[]) {
    return exercises.map((exercise) => ({
      ...exercise,
      sets: (exercise.sets || []).map((set: any) => {
        const plannedType = setTypeOf(set, 'expected')
        const setData: any = {
          ...set,
          weight: {
            expected: set.weight?.expected,
            actual: set.weight?.expected,
          },
          reps: {
            expected: set.reps?.expected,
            actual: set.reps?.expected,
          },
          isDone: false,
          type: { expected: plannedType, actual: plannedType },
        }

        if (set.rir?.expected != null) {
          setData.rir = {
            expected: set.rir.expected,
            actual: set.rir.expected,
          }
        } else if (set.rpe?.expected != null) {
          setData.rpe = {
            expected: set.rpe.expected,
            actual: set.rpe.expected,
          }
        }

        return setData
      }),
    }))
  }
  static async getNextInstructionsByWorkoutId(filter: {
    workoutId: string
    // forUserId: string
  }) {
    try {
      const instruction = await Instructions.findOne({
        ...filter,
        isDone: false,
      })

      if (!instruction) {
        return null
      }

      return instruction
    } catch (err) {
      logger.error(
        `Failed to get instructions by workout id ${filter.workoutId}`,
        err
      )
      throw err
    }
  }

  static async getById(instructionId: string) {
    try {
      const instruction = await Instructions.findById(instructionId)
      return instruction
    } catch (err) {
      logger.error(`Failed to get instruction ${instructionId}`, err)
      throw err
    }
  }

  static async add(instruction: Partial<IInstructions>) {
    try {
      const sanitizedInstruction = this.sanitizeInstructionSets(instruction)
      const addedInstruction = await Instructions.create(sanitizedInstruction)
      return addedInstruction
    } catch (err) {
      logger.error('Failed to add instruction', err)
      throw err
    }
  }

  static async update(
    instructionId: string,
    instructionToUpdate: Partial<IInstructions>
  ) {
    try {
      const sanitizedInstruction =
        this.sanitizeInstructionSets(instructionToUpdate)

      // Build update object with $unset for fields that need to be removed from nested sets
      const update: any = { ...sanitizedInstruction }

      const isFinished = instructionToUpdate.isFinished
      //  || instructionToUpdate?.exercises?.every((exercise) =>
      //   exercise.sets.every((set) => set.isDone)
      // )

      // For nested arrays, we need to ensure the update properly removes RPE/RIR
      // MongoDB will handle this when we update the entire exercises array
      let instruction = await Instructions.findByIdAndUpdate(
        instructionId,
        { ...update, isFinished },
        {
          new: true,
        }
      )

      return instruction
    } catch (err) {
      logger.error(`Failed to update instruction ${instructionId}`, err)
      throw err
    }
  }

  static async remove(instructionId: string) {
    try {
      await Instructions.findByIdAndDelete(instructionId)
    } catch (err) {
      logger.error(`Failed to remove instruction ${instructionId}`, err)
      throw err
    }
  }

  static async getWeekNumberDone(workoutId: string) {
    try {
      const allInstructions = await Instructions.find({ workoutId })

      const weekNumberDone = allInstructions.map((instruction) => {
        return {
          weekNumber: instruction.weekNumber,
          isDone: instruction.isDone,
        }
      })

      return weekNumberDone
      // return weekNumberDone
    } catch (err) {
      logger.error(`Failed to get week number done ${workoutId}`, err)
      throw err
    }
  }

  static async undoPlayWorkout(instructionsId: string) {
    try {
      const instructions = await Instructions.findById(instructionsId)
      if (!instructions) {
        return null
      }
      const updatedInstructions = await Instructions.findByIdAndUpdate(
        instructionsId,
        {
          isDone: false,
          doneTimes: instructions.doneTimes - 1,
        },
        { new: true }
      )

      return updatedInstructions
    } catch (err) {
      logger.error(`Failed to undo play workout ${instructionsId}`, err)
      throw err
    }
  }
  static async getNotesBySessionIdAndExerciseId(
    sessionId: string,
    exerciseId: string
  ) {
    try {
      const session = await SessionService.getById(sessionId)

      if (!session || !session.instructionsId) {
        logger.error(`Session not found ${sessionId}`)
        return null
      }

      const instruction = await this.getById(session.instructionsId)

      if (!instruction) {
        logger.error(`Instruction not found ${sessionId}`)
        return null
      }

      const notes = instruction.exercises.find(
        (exercise) => exercise.exerciseId === exerciseId
      )?.notes

      return notes
    } catch (err) {
      logger.error(`Failed to get actual notes ${sessionId} ${exerciseId}`, err)
      throw err
    }
  }
}
