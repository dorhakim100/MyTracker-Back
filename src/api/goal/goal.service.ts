import { GoalModel, IGoal } from './goal.model'
import { logger } from '../../services/logger.service'

export class GoalService {
  static async listByUser(userId: string) {
    try {
      const goals = await GoalModel.find({ userId }).sort({ startDate: -1 })
      return goals
    } catch (err) {
      logger.error(`GoalService.listByUser failed for ${userId}`, err)
      throw err
    }
  }

  static async getById(id: string) {
    try {
      const goal = await GoalModel.findById(id)
      return goal
    } catch (err) {
      logger.error(`GoalService.getById failed for ${id}`, err)
      throw err
    }
  }

  static async add(goal: Partial<IGoal> & { userId: string }) {
    try {
      const goalToSave = {
        isSelected: true,
        title: goal.title,
        dailyCalories: goal.dailyCalories,
        macros: goal.macros,
        startDate: goal.startDate,
        endDate: goal.endDate,
        target: goal.target,
        targetWeight: goal.targetWeight,
        updatedAt: Date.now(),
        userId: goal.userId,
      }
      await this.setAllGoalsAsNotSelected(goal.userId)
      const created = await GoalModel.create(goalToSave)

      return created
    } catch (err) {
      logger.error('GoalService.add failed', err)
      throw err
    }
  }

  static async update(id: string, goalToUpdate: Partial<IGoal>) {
    try {
      goalToUpdate.updatedAt = Date.now()
      const updated = await GoalModel.findByIdAndUpdate(id, goalToUpdate, {
        new: true,
      })
      return updated
    } catch (err) {
      logger.error(`GoalService.update failed for ${id}`, err)
      throw err
    }
  }

  static async remove(id: string) {
    try {
      await GoalModel.findByIdAndDelete(id)
    } catch (err) {
      logger.error(`GoalService.remove failed for ${id}`, err)
      throw err
    }
  }

  static async select(userId: string, goalId: string) {
    try {
      // Unselect all
      await GoalModel.updateMany({ userId }, { $set: { isSelected: false } })
      // Select given

      const updated = await GoalModel.findByIdAndUpdate(goalId, {
        isSelected: true,
        updatedAt: Date.now(),
      })
      console.log(updated)

      return updated
    } catch (err) {
      logger.error(`GoalService.select failed for ${goalId}`, err)
      throw err
    }
  }

  static async setAllGoalsAsNotSelected(userId: string) {
    try {
      await GoalModel.updateMany({ userId }, { $set: { isSelected: false } })
    } catch (err) {
      logger.error(
        `GoalService.setAllGoalsAsNotSelected failed for ${userId}`,
        err
      )
      throw err
    }
  }
}
