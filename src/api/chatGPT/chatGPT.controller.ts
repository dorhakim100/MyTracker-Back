import { Request, Response } from 'express'
import { ChatGPTService } from './chatGPT.service'

export class ChatGPTController {
  static async chat(req: Request, res: Response) {
    try {
      const { message } = req.body
      if (!message) {
        // return res.status(400).send({ err: 'Message is required' })
      }

      const response = await ChatGPTService.chat(message)
      res.json({ response })
    } catch (err: any) {
      res
        .status(500)
        .send({ err: err.message || 'Failed to process chat request' })
    }
  }

  static async changeExercise(req: Request, res: Response) {
    try {
      console.log('req.body', req.body)
      const { oldExercise, newExercise, instructionsId } = req.body
      if (!oldExercise || !newExercise || !instructionsId) {
        return res.status(400).send({
          err: 'oldExercise, newExercise and instructionsId are required',
        })
      }

      const response = await ChatGPTService.changeExercise(
        oldExercise,
        newExercise,
        instructionsId
      )
      res.json({ response })
    } catch (err: any) {
      res.status(500).send({
        err: err.message || 'Failed to process change exercise request',
      })
    }
  }
}
