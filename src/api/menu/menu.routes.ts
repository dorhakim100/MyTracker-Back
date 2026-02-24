import { Router } from 'express'
import { MenuController } from './menu.controller'
import { requireAuth } from '../../middleware/auth.middleware'

const router = Router()

router.get('/', MenuController.getMenus)
router.get('/user/:userId', MenuController.getMenusByUser)
router.get('/:id', MenuController.getMenu)
router.post('/', requireAuth, MenuController.addMenu)
router.put('/select', requireAuth, MenuController.selectMenu)
router.put('/:id', requireAuth, MenuController.updateMenu)
router.delete('/:id', requireAuth, MenuController.deleteMenu)

export const menuRoutes = router
