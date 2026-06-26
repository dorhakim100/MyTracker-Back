import { Router } from 'express'
import { AuthController } from './auth.controller'

const router = Router()

router.post('/login', AuthController.login)
router.post('/signup', AuthController.signup)
router.post('/logout', AuthController.logout)
router.get('/google', AuthController.googleAuth)
router.get('/google/callback', AuthController.googleCallback)
router.post('/google/complete', AuthController.completeGoogleAuth)

export const authRoutes = router
