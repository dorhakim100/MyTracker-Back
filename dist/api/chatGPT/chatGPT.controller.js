'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.ChatGPTController = void 0
const chatGPT_service_1 = require('./chatGPT.service')
class ChatGPTController {
  static async chat(req, res) {
    try {
      const { message } = req.body
      if (!message) {
        // return res.status(400).send({ err: 'Message is required' })
      }
      const response = await chatGPT_service_1.ChatGPTService.chat(message)
      res.json({ response })
    } catch (err) {
      res
        .status(500)
        .send({ err: err.message || 'Failed to process chat request' })
    }
  }
  static async changeExercise(req, res) {
    try {
      // console.log('req.body', req.body);
      const { oldExercise, newExercise, instructionsId } = req.body
      if (!oldExercise || !newExercise || !instructionsId) {
        return res.status(400).send({
          err: 'oldExercise, newExercise and instructionsId are required',
        })
      }
      const response = await chatGPT_service_1.ChatGPTService.changeExercise(
        oldExercise,
        newExercise,
        instructionsId
      )
      res.json({ response })
    } catch (err) {
      res.status(500).send({
        err: err.message || 'Failed to process change exercise request',
      })
    }
  }
}
exports.ChatGPTController = ChatGPTController
