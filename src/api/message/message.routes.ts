import { Router } from 'express'
import { MessageController } from './message.controller'
import { protect } from '../../middleware/auth.middleware'

const router = Router()

router.get('/', protect, MessageController.list)
router.get('/unread', protect, MessageController.unread)
router.post('/', protect, MessageController.add)
router.put('/read', protect, MessageController.markRead)
router.put('/:id', protect, MessageController.update)
router.delete('/:id', protect, MessageController.remove)

export const messageRoutes = router
