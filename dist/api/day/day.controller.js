'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.DayController = void 0
const day_service_1 = require('./day.service')
class DayController {
  static async get(req, res) {
    const { date, userId } = req.query
    try {
      const days = await day_service_1.DayService.getByUserAndDate(userId, date)
      res.json(days)
    } catch (err) {
      res.status(500).send({ err: 'Failed to get days' })
    }
  }
  static async upsert(req, res) {
    try {
      const { userId, date, logs, calories } = req.body
      const day = await day_service_1.DayService.upsertFromLoggedToday({
        userId,
        date,
        logs,
        calories,
      })
      res.json(day)
    } catch (err) {
      res.status(400).send({ err: err.message || 'Failed to upsert day' })
    }
  }
  static async getById(req, res) {
    try {
      const day = await day_service_1.DayService.getById(req.params.id)
      if (!day) return res.status(404).send({ err: 'Day not found' })
      res.json(day)
    } catch (err) {
      res.status(500).send({ err: 'Failed to get day' })
    }
  }
  static async getByDate(req, res) {
    try {
      const { userId } = req.params
      const { date } = req.query
      const day = await day_service_1.DayService.getByUserAndDate(userId, date)
      if (!day) return res.status(404).send({ err: 'Day not found' })
      res.json(day)
    } catch (err) {
      res.status(500).send({ err: 'Failed to get day' })
    }
  }
  static async listByUser(req, res) {
    try {
      const { userId } = req.params
      const limit = parseInt(String(req.query.limit || '30'), 10)
      const days = await day_service_1.DayService.listByUser(userId, limit)
      res.json(days)
    } catch (err) {
      res.status(500).send({ err: 'Failed to list days' })
    }
  }
  static async update(req, res) {
    try {
      const day = await day_service_1.DayService.update(req.body)
      res.json(day)
    } catch (err) {
      res.status(500).send({ err: 'Failed to update day' })
    }
  }
}
exports.DayController = DayController
