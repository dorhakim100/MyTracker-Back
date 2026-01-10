import { Router } from 'express'
import { ChatGPTController } from './chatGPT.controller'
import { protect, requireAuth } from '../../middleware/auth.middleware'

const router = Router()

router.post('/', requireAuth, ChatGPTController.chat)
router.post('/change-exercise', requireAuth, ChatGPTController.changeExercise)

export const chatGPTRoutes = router
