import { Instructions, IInstructions } from './instructions.model'
import { logger } from '../../services/logger.service'

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
}
