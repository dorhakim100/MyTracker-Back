import { Router } from 'express'
import { MenuController } from './menu.controller'
import {
  requireDocAccess,
  requireUserAccess,
} from '../../middleware/user-access.middleware'
import { Menu } from './menu.model'

const router = Router()

const queryUser = requireUserAccess([
  { from: 'query', name: 'userId', required: true },
])
const bodyUser = requireUserAccess([
  { from: 'body', name: 'userId', required: true },
])
const paramUser = requireUserAccess([
  { from: 'params', name: 'userId', required: true },
])
const ownMenu = requireDocAccess(Menu, 'userId')
const selectMenuUser = requireUserAccess([
  { from: 'body', name: 'menu.userId', required: true },
])
const selectedMenu = requireDocAccess(Menu, 'userId', { body: 'menu._id' })

router.get('/', queryUser, MenuController.getMenus)
router.get('/user/:userId', paramUser, MenuController.getMenusByUser)
router.get('/:id', ownMenu, MenuController.getMenu)
router.post('/', bodyUser, MenuController.addMenu)
router.put('/select', selectMenuUser, selectedMenu, MenuController.selectMenu)
router.put('/:id', ownMenu, requireUserAccess([{ from: 'body', name: 'userId' }]), MenuController.updateMenu)
router.delete('/:id', ownMenu, MenuController.deleteMenu)

export const menuRoutes = router
