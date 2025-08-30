import { Router } from 'express'
import { DayController } from './day.controller'
import { protect } from '../../middleware/auth.middleware'

const router = Router()

router.post('/', protect, DayController.upsert)
router.get('/:id', protect, DayController.getById)
router.get('/user/:userId', protect, DayController.listByUser)
router.get('/by-date/:userId', protect, DayController.getByDate)

export const dayRoutes = router
