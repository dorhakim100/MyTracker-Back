import { Router } from 'express'
import { SessionController } from './session.controller'
import { requireAuth } from '../../middleware/auth.middleware'

const router = Router()

router.get('/', requireAuth, SessionController.get)
router.put('/play/empty', requireAuth, SessionController.playEmptyWorkout)
router.put('/play/:id', requireAuth, SessionController.playWorkout)
router.post('/', requireAuth, SessionController.add)
router.get('/:id', requireAuth, SessionController.getById)
router.put('/:id', requireAuth, SessionController.update)
router.delete('/:id', requireAuth, SessionController.delete)
router.get('/user/:userId', requireAuth, SessionController.listByUser)
router.get('/by-date/:userId', requireAuth, SessionController.getByDate)

export const sessionRoutes = router
