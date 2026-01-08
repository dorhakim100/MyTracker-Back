import { Request, Response } from 'express'
import { GoalService } from './goal.service'

export class GoalController {
  static async listByUser(req: Request, res: Response) {
    try {
      const { userId } = req.params
      const goals = await GoalService.listByUser(userId)
      res.json(goals)
    } catch (err: any) {
      res.status(500).send({ err: 'Failed to list goals' })
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const goal = await GoalService.getById(req.params.id)
      if (!goal) return res.status(404).send({ err: 'Goal not found' })
      res.json(goal)
    } catch (err: any) {
      res.status(500).send({ err: 'Failed to get goal' })
    }
  }

  static async add(req: Request, res: Response) {
    try {
      const added = await GoalService.add(req.body)
      res.json(added)
    } catch (err: any) {
      res.status(400).send({ err: err.message || 'Failed to add goal' })
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const updated = await GoalService.update(req.params.id, req.body)
      res.json(updated)
    } catch (err: any) {
      res.status(400).send({ err: err.message || 'Failed to update goal' })
    }
  }

  static async remove(req: Request, res: Response) {
    try {
      await GoalService.remove(req.params.id)
      res.send({ msg: 'Deleted successfully' })
    } catch (err: any) {
      res.status(400).send({ err: err.message || 'Failed to remove goal' })
    }
  }

  static async select(req: Request, res: Response) {
    try {
      const { userId, goalId } = req.body as { userId: string; goalId: string }

      const updated = await GoalService.select(userId, goalId)
      res.json(updated)
    } catch (err: any) {
      res.status(400).send({ err: err.message || 'Failed to select goal' })
    }
  }
}
