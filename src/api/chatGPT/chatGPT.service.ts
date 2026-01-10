import { logger } from '../../services/logger.service'

export class ChatGPTService {
  static async chat(message: string): Promise<string> {
    try {
      // Minimal implementation for testing
      // TODO: Integrate with OpenAI API
      logger.info('ChatGPTService.chat called with message:', message)

      return `Echo: ${message}`
    } catch (err) {
      logger.error('ChatGPTService.chat failed', err)
      throw err
    }
  }
}
