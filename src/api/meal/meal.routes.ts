import { Router } from 'express'
import { MealController } from './meal.controller'
import {
  requireDocAccess,
  requireManyDocs,
  requireUserAccess,
} from '../../middleware/user-access.middleware'
import { Meal } from './meal.model'

const router = Router()

const listMeals = requireUserAccess([
  { from: 'query', name: 'createdBy', required: true },
])
const ownMeals = requireManyDocs(Meal, 'createdBy', { query: 'mealIds' })
const ownMeal = requireDocAccess(Meal, 'createdBy')
const mealOwner = requireUserAccess([
  { from: 'body', name: 'createdBy', required: true },
])

router.get('/', listMeals, MealController.getMeals)
router.get('/bulk', ownMeals, MealController.getMealsBulk)
router.get('/:id', ownMeal, MealController.getMeal)
router.post('/', mealOwner, MealController.addMeal)
router.put('/:id', ownMeal, requireUserAccess([{ from: 'body', name: 'createdBy' }]), MealController.updateMeal)
router.delete('/:id', ownMeal, MealController.deleteMeal)

export const mealRoutes = router
