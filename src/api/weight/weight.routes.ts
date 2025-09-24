import { Router } from 'express'
import { WeightController } from './weight.controller'
import { requireAuth } from '../../middleware/auth.middleware'

const router = Router()

router.get('/', requireAuth, WeightController.getWeightsByUser)
router.get('/:id', requireAuth, WeightController.getWeightById)
router.post('/', requireAuth, WeightController.add)
router.put('/:id', requireAuth, WeightController.update)
router.delete('/:id', requireAuth, WeightController.remove)

export const weightRoutes = router
