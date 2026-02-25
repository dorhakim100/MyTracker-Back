import { Request, Response } from 'express'
import { MenuService } from './menu.service'
import { logger } from '../../services/logger.service'

export class MenuController {
  static async getMenus(req: Request, res: Response) {
    try {
      const menus = await MenuService.query(req.query)
      res.json(menus)
    } catch (err: any) {
      logger.error('Failed to get menus', err)
      res.status(500).send({ err: 'Failed to get menus' })
    }
  }

  static async getMenu(req: Request, res: Response) {
    try {
      const menu = await MenuService.getById(req.params.id)
      res.json(menu)
    } catch (err: any) {
      logger.error('Failed to get menu', err)
      res.status(500).send({ err: 'Failed to get menu' })
    }
  }

  static async getMenusByUser(req: Request, res: Response) {
    try {
      const menus = await MenuService.getByUserId(req.params.userId)
      res.json(menus)
    } catch (err: any) {
      logger.error('Failed to get menus by user', err)
      res.status(500).send({ err: 'Failed to get menus by user' })
    }
  }

  static async addMenu(
    req: Request & { user?: { _id: string } },
    res: Response
  ) {
    try {
      const menu = req.body

      const addedMenu = await MenuService.add(menu)
      res.json(addedMenu)
    } catch (err: any) {
      logger.error('Failed to add menu', err)
      res.status(500).send({ err: 'Failed to add menu' })
    }
  }

  static async selectMenu(req: Request, res: Response) {
    try {
      const { menu } = req.body
      const savedMenu = await MenuService.select(menu)
      res.json(savedMenu)
    } catch (err: any) {
      logger.error('Failed to select menu', err)
      res.status(500).send({ err: 'Failed to select menu' })
    }
  }
  static async updateMenu(req: Request, res: Response) {
    try {
      const menu = await MenuService.update(req.params.id, req.body)
      res.json(menu)
    } catch (err: any) {
      logger.error('Failed to update menu', err)
      res.status(500).send({ err: 'Failed to update menu' })
    }
  }

  static async deleteMenu(req: Request, res: Response) {
    try {
      await MenuService.remove(req.params.id)
      res.send({ msg: 'Deleted successfully' })
    } catch (err: any) {
      logger.error('Failed to delete menu', err)
      res.status(500).send({ err: 'Failed to delete menu' })
    }
  }
}
