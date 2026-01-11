import OpenAI from 'openai'

import { logger } from '../../services/logger.service'

import { Instructions } from '../instructions/instructions.model'
import { buildChangeExercisePrompt } from './prompts/change.exercise'

const OPENAI_API_KEY = process.env.GPT_API_KEY
const client = new OpenAI({ apiKey: OPENAI_API_KEY })

const models = {
  gpt5nano: 'gpt-5-nano',
  gpt5mini: 'gpt-5-mini',
}

export class ChatGPTService {
  static async chat(message: string) {
    try {
      const response = await client.responses.create({
        model: models.gpt5mini,
        input: 'Write a one character output for testing',
      })

      return response.output_text
    } catch (err) {
      logger.error('ChatGPTService.chat failed', err)
      throw new Error('Failed to process chat request')
    }
  }

  static async changeExercise(
    oldExercise: string,
    newExercise: string,
    instructionsId: string
  ) {
    try {
      const instructions = await Instructions.findById(instructionsId)

      // console.log('instructions', instructions)

      const promptMessages = buildChangeExercisePrompt(oldExercise, newExercise)

      // const response = await client.responses.create({
      //   model: models.gpt5mini,
      //   input: promptMessages,
      //   // max_output_tokens: 120,
      // })

      // return JSON.parse(response.output_text)
    } catch (err: any) {
      logger.error('ChatGPTService.changeExercise failed', err)
      throw err
    }
  }
}
