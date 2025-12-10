import { Instructions, IInstructions } from './instructions.model'
import { logger } from '../../services/logger.service'
import { SessionService } from '../session/session.service'

export class InstructionsService {
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
          return await Instructions.create({
            ...instructionsWithoutId,
            weekNumber: filter.weekNumber,
            timesPerWeek: instructionsObj.timesPerWeek,
            doneTimes: 0,
            isDone: false,
          })
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
  static async getNextInstructionsByWorkoutIdAndUpdate(filter: {
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

      const newDoneTimes = instruction.doneTimes + 1

      const isDoneToSet =
        newDoneTimes >= instruction.timesPerWeek ? true : false

      const updatedInstruction = await Instructions.findByIdAndUpdate(
        instruction._id,
        { doneTimes: newDoneTimes, isDone: isDoneToSet },
        { new: true }
      )

      return updatedInstruction
    } catch (err) {
      logger.error(
        `Failed to get instructions by workout id ${filter.workoutId}`,
        err
      )
      throw err
    }
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
      const addedInstruction = await Instructions.create(instruction)
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
      const instruction = await Instructions.findByIdAndUpdate(
        instructionId,
        instructionToUpdate,
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
