import { Menu, IMenu } from './menu.model'
import { logger } from '../../services/logger.service'

export class MenuService {
  static async query(filterBy = {}) {
    try {
      const menus = await Menu.find(filterBy).populate('menuLogs')
      return menus
    } catch (err) {
      logger.error('Failed to query menus', err)
      throw err
    }
  }

  static async getById(menuId: string) {
    try {
      const menu = await Menu.findById(menuId).populate('menuLogs')
      return menu
    } catch (err) {
      logger.error(`Failed to get menu ${menuId}`, err)
      throw err
    }
  }

  static async getByUserId(userId: string) {
    try {
      const menus = await Menu.find({ userId }).populate('menuLogs')
      return menus
    } catch (err) {
      logger.error(`Failed to get menus for user ${userId}`, err)
      throw err
    }
  }

  static async add(menu: Partial<IMenu>) {
    try {
      const addedMenu = await Menu.create(menu)

      return addedMenu.populate('menuLogs')
    } catch (err) {
      logger.error('Failed to add menu', err)
      throw err
    }
  }

  static async update(menuId: string, menuToUpdate: Partial<IMenu>) {
    try {
      const menu = await Menu.findByIdAndUpdate(menuId, menuToUpdate, {
        new: true,
      }).populate('menuLogs')
      return menu
    } catch (err) {
      logger.error(`Failed to update menu ${menuId}`, err)
      throw err
    }
  }

  static async remove(menuId: string) {
    try {
      await Menu.findByIdAndDelete(menuId)
    } catch (err) {
      logger.error(`Failed to remove menu ${menuId}`, err)
      throw err
    }
  }

  static async select(menu: IMenu & { _id: string }) {
    try {
      const { userId, _id: menuId } = menu
      await Menu.updateMany({ userId }, { $set: { isSelected: false } })
      const savedMenu = await Menu.findByIdAndUpdate(
        menuId,
        { isSelected: true },
        { new: true }
      ).populate('menuLogs')
      return savedMenu
    } catch (err) {
      logger.error(`Failed to select menu ${menu._id}`, err)
      throw err
    }
  }
}
