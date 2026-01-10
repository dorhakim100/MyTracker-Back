import OpenAI from 'openai'

import { logger } from '../../services/logger.service'

const OPENAI_API_KEY = process.env.GPT_API_KEY
const client = new OpenAI({ apiKey: OPENAI_API_KEY })

export class ChatGPTService {
  static async chat(message: string) {
    try {
      const response = await client.responses.create({
        model: 'gpt-5-nano',
        input: 'Write a one character output for testing',
      })

      console.log(response)

      //  return response.output[0].text
    } catch (err) {
      logger.error('ChatGPTService.chat failed', err)
      throw new Error('Failed to process chat request')
    }
  }
}
