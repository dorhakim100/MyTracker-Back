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
      const instruction = req.body
      const addedInstruction = await InstructionsService.add(instruction)
      res.json(addedInstruction)
    } catch (err: any) {
      logger.error('Failed to add instruction', err)
      res.status(500).send({ err: 'Failed to add instruction' })
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
}
