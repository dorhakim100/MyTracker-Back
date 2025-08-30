import { Router } from 'express'
import { DayController } from './day.controller'
import { protect, requireAuth } from '../../middleware/auth.middleware'

const router = Router()

router.get('/', requireAuth, DayController.get)
router.post('/', requireAuth, DayController.upsert)
router.get('/:id', requireAuth, DayController.getById)
router.put('/:id', requireAuth, DayController.update)
router.get('/user/:userId', requireAuth, DayController.listByUser)
router.get('/by-date/:userId', requireAuth, DayController.getByDate)

export const dayRoutes = router
