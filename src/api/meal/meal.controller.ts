import { Request, Response } from 'express'
import { MealService } from './meal.service'
import { logger } from '../../services/logger.service'

export class MealController {
  static async getMeals(req: Request, res: Response) {
    try {
      const meals = await MealService.query(req.query)
      res.json(meals)
    } catch (err: any) {
      logger.error('Failed to get meals', err)
      res.status(500).send({ err: 'Failed to get meals' })
    }
  }

  static async getMeal(req: Request, res: Response) {
    try {
      const meal = await MealService.getById(req.params.id)
      res.json(meal)
    } catch (err: any) {
      logger.error('Failed to get meal', err)
      res.status(500).send({ err: 'Failed to get meal' })
    }
  }

  static async addMeal(
    req: Request & { user?: { _id: string } },
    res: Response
  ) {
    try {
      const meal = req.body

      logger.info('Adding meal', meal)

      // log.createdBy = req.user?._id as string
      const addedMeal = await MealService.add(meal)
      res.json(addedMeal)
    } catch (err: any) {
      logger.error('Failed to add meal', err)
      res.status(500).send({ err: 'Failed to add meal' })
    }
  }

  static async updateMeal(req: Request, res: Response) {
    try {
      const meal = await MealService.update(req.params.id, req.body)

      res.json(meal)
    } catch (err: any) {
      logger.error('Failed to update meal', err)
      res.status(500).send({ err: 'Failed to update meal' })
    }
  }

  static async deleteMeal(req: Request, res: Response) {
    try {
      await MealService.remove(req.params.id)
      res.send({ msg: 'Deleted successfully' })
    } catch (err: any) {
      logger.error('Failed to delete meal', err)
      res.status(500).send({ err: 'Failed to delete meal' })
    }
  }
}
