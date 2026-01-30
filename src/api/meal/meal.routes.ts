import { Router } from 'express'
import { MealController } from './meal.controller'
import { requireAuth } from '../../middleware/auth.middleware'

const router = Router()

router.get('/', MealController.getMeals)
router.get('/bulk', MealController.getMealsBulk)
router.get('/:id', MealController.getMeal)
router.post('/', requireAuth, MealController.addMeal)
router.put('/:id', requireAuth, MealController.updateMeal)
router.delete('/:id', requireAuth, MealController.deleteMeal)

export const mealRoutes = router
