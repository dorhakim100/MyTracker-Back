import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.middleware'
import { TranslateController } from './translate.controller'

const router = Router()

router.get('/', requireAuth, TranslateController.translate)

export const translateRoutes = router
