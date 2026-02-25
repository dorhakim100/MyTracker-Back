'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.ChatGPTService = void 0
const openai_1 = __importDefault(require('openai'))
const logger_service_1 = require('../../services/logger.service')
const instructions_model_1 = require('../instructions/instructions.model')
const change_exercise_1 = require('./prompts/change.exercise')
const OPENAI_API_KEY = process.env.GPT_API_KEY
const client = new openai_1.default({ apiKey: OPENAI_API_KEY })
const models = {
  gpt5nano: 'gpt-5-nano',
  gpt5mini: 'gpt-5-mini',
}
class ChatGPTService {
  static async chat(message) {
    try {
      const response = await client.responses.create({
        model: models.gpt5mini,
        input: 'Write a one character output for testing',
      })
      return response.output_text
    } catch (err) {
      logger_service_1.logger.error('ChatGPTService.chat failed', err)
      throw new Error('Failed to process chat request')
    }
  }
  static async changeExercise(oldExercise, newExercise, instructionsId) {
    try {
      const instructions = await instructions_model_1.Instructions.findById(
        instructionsId
      )
      // console.log('instructions', instructions)
      const promptMessages = (0, change_exercise_1.buildChangeExercisePrompt)(
        oldExercise,
        newExercise
      )
      // const response = await client.responses.create({
      //   model: models.gpt5mini,
      //   input: promptMessages,
      //   // max_output_tokens: 120,
      // })
      // return JSON.parse(response.output_text)
    } catch (err) {
      logger_service_1.logger.error('ChatGPTService.changeExercise failed', err)
      throw err
    }
  }
}
exports.ChatGPTService = ChatGPTService
