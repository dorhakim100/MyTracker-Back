import { Router } from 'express'
import { GoalController } from './goal.controller'
import { requireAuth } from '../../middleware/auth.middleware'

const router = Router()

router.get('/user/:userId', requireAuth, GoalController.listByUser)
router.get('/:id', requireAuth, GoalController.getById)
router.put('/select', requireAuth, GoalController.select)
router.post('/', requireAuth, GoalController.add)
router.put('/:id', requireAuth, GoalController.update)
router.delete('/:id', requireAuth, GoalController.remove)

export const goalRoutes = router
