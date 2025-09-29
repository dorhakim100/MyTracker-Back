import { Weight, IWeight } from './weight.model'
import { logger } from '../../services/logger.service'

export class WeightService {
  static async query(filterBy: Partial<IWeight> = {}) {
    try {
      const weights = await Weight.find(filterBy as any).sort({ createdAt: -1 })
      return weights
    } catch (err) {
      logger.error('WeightService.query failed', err)
      throw err
    }
  }

  static async listByUser(userId: string, fromDate: string, toDate: string) {
    try {
      const fromDateMs = new Date(fromDate).getTime()
      const toDateMs = new Date(toDate).getTime()
      const weights = await Weight.find({
        userId,
        createdAt: { $gte: fromDateMs, $lte: toDateMs },
      }).sort({ createdAt: -1 })

      return weights
    } catch (err) {
      logger.error(`WeightService.listByUser failed for ${userId}`, err)
      throw err
    }
  }

  static async getById(id: string) {
    try {
      const weight = await Weight.findById(id)
      return weight
    } catch (err) {
      logger.error(`WeightService.getById failed for ${id}`, err)
      throw err
    }
  }

  static async add(weight: Partial<IWeight>) {
    try {
      const added = await Weight.create(weight)
      return added
    } catch (err) {
      logger.error('WeightService.add failed', err)
      throw err
    }
  }

  static async update(id: string, weightToUpdate: Partial<IWeight>) {
    try {
      const updated = await Weight.findByIdAndUpdate(id, weightToUpdate, {
        new: true,
      })
      return updated
    } catch (err) {
      logger.error(`WeightService.update failed for ${id}`, err)
      throw err
    }
  }

  static async remove(id: string) {
    try {
      await Weight.findByIdAndDelete(id)
    } catch (err) {
      logger.error(`WeightService.remove failed for ${id}`, err)
      throw err
    }
  }
}
