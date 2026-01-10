import { Request, Response } from 'express'
import { ChatGPTService } from './chatGPT.service'

export class ChatGPTController {
  static async chat(req: Request, res: Response) {
    try {
      const { message } = req.body
      if (!message) {
        return res.status(400).send({ err: 'Message is required' })
      }

      const response = await ChatGPTService.chat(message)
      res.json({ response })
    } catch (err: any) {
      res.status(500).send({ err: err.message || 'Failed to process chat request' })
    }
  }
}
