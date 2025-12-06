import { Request, Response } from 'express'
import { InstructionsService } from './instructions.service'
import { logger } from '../../services/logger.service'

export class InstructionsController {
  static async getInstructions(req: Request, res: Response) {
    try {
      const instructions = await InstructionsService.query(req.query)
      res.json(instructions)
    } catch (err: any) {
      logger.error('Failed to get instructions', err)
      res.status(500).send({ err: 'Failed to get instructions' })
    }
  }

  static async getInstructionsByWorkoutId(req: Request, res: Response) {
    try {
      const filter = {
        workoutId: req.params.workoutId || '',
        weekNumber: Number(req.query.weekNumber) || 1,
        // forUserId: (req.query.forUserId as string) || '',
      }

      const instructions = await InstructionsService.getByWorkoutId(filter)
      res.json(instructions)
    } catch (err: any) {
      logger.error('Failed to get instructions by workout id', err)
      res.status(500).send({ err: 'Failed to get instructions by workout id' })
    }
  }
  static async getInstruction(req: Request, res: Response) {
    try {
      const instruction = await InstructionsService.getById(req.params.id)
      if (!instruction) {
        return res.status(404).send({ err: 'Instruction not found' })
      }
      res.json(instruction)
    } catch (err: any) {
      logger.error('Failed to get instruction', err)
      res.status(500).send({ err: 'Failed to get instruction' })
    }
  }

  static async addInstruction(req: Request, res: Response) {
    try {
      const instructions = req.body

      delete instructions._id
      const addedInstructions = await InstructionsService.add(instructions)
      res.json(addedInstructions)
    } catch (err: any) {
      logger.error('Failed to add instructions', err)
      res.status(500).send({ err: 'Failed to add instructions' })
    }
  }

  static async updateInstruction(
    req: Request & { user?: { _id: string } },
    res: Response
  ) {
    try {
      const instruction = req.body

      logger.info('Updating instruction', instruction)

      const updatedInstruction = await InstructionsService.update(
        req.params.id,
        instruction
      )
      res.json(updatedInstruction)
    } catch (err: any) {
      logger.error('Failed to update instruction', err)
      res.status(500).send({ err: 'Failed to update instruction' })
    }
  }

  static async deleteInstruction(req: Request, res: Response) {
    try {
      const instruction = await InstructionsService.remove(req.params.id)
      res.send({ msg: 'Deleted successfully' })
    } catch (err: any) {
      logger.error('Failed to delete instruction', err)
      res.status(500).send({ err: 'Failed to delete instruction' })
    }
  }

  static async getWeekNumberDone(req: Request, res: Response) {
    try {
      const workoutId = req.query.workoutId

      const weekNumberDone = await InstructionsService.getWeekNumberDone(
        workoutId as string
      )
      res.send(weekNumberDone)
    } catch (err: any) {
      logger.error('Failed to get week number done', err)
      res.status(500).send({ err: 'Failed to get week number done' })
    }
  }
}
