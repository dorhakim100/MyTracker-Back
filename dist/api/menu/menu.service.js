'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.MenuService = void 0
const mongoose_1 = __importDefault(require('mongoose'))
const menu_model_1 = require('./menu.model')
const logger_service_1 = require('../../services/logger.service')
function normalizeMenuLogIds(logs) {
  if (!logs || !Array.isArray(logs)) return []
  return logs
    .map((id) => {
      if (!id) return null
      if (typeof id === 'string') return id
      if (id instanceof mongoose_1.default.Types.ObjectId) return id
      if (typeof id === 'object' && id && id._id) return id._id
      return null
    })
    .filter(Boolean)
    .map((id) => new mongoose_1.default.Types.ObjectId(id))
}
class MenuService {
  static async query(filterBy = {}) {
    try {
      const menus = await menu_model_1.Menu.find(filterBy).populate('menuLogs')
      return menus
    } catch (err) {
      logger_service_1.logger.error('Failed to query menus', err)
      throw err
    }
  }
  static async getById(menuId) {
    try {
      const menu = await menu_model_1.Menu.findById(menuId).populate('menuLogs')
      return menu
    } catch (err) {
      logger_service_1.logger.error(`Failed to get menu ${menuId}`, err)
      throw err
    }
  }
  static async getByUserId(userId) {
    try {
      const menus = await menu_model_1.Menu.find({ userId }).populate(
        'menuLogs'
      )
      return menus
    } catch (err) {
      logger_service_1.logger.error(
        `Failed to get menus for user ${userId}`,
        err
      )
      throw err
    }
  }
  static async add(menu) {
    try {
      const menuLogs = normalizeMenuLogIds(menu.menuLogs ?? menu.logs)
      const menuToCreate = {
        userId: menu.userId,
        menuLogs,
        name: menu.name ?? 'New Menu',
        isSelected: menu.isSelected ?? false,
      }
      const addedMenu = await menu_model_1.Menu.create(menuToCreate)
      return addedMenu.populate('menuLogs')
    } catch (err) {
      logger_service_1.logger.error('Failed to add menu', err)
      throw err
    }
  }
  static async update(menuId, menuToUpdate) {
    try {
      const update = { ...menuToUpdate }
      if (
        menuToUpdate.menuLogs !== undefined ||
        menuToUpdate.logs !== undefined
      ) {
        update.menuLogs = normalizeMenuLogIds(
          menuToUpdate.menuLogs ?? menuToUpdate.logs
        )
      }
      delete update.logs
      const menu = await menu_model_1.Menu.findByIdAndUpdate(menuId, update, {
        new: true,
      }).populate('menuLogs')
      return menu
    } catch (err) {
      logger_service_1.logger.error(`Failed to update menu ${menuId}`, err)
      throw err
    }
  }
  static async remove(menuId) {
    try {
      await menu_model_1.Menu.findByIdAndDelete(menuId)
    } catch (err) {
      logger_service_1.logger.error(`Failed to remove menu ${menuId}`, err)
      throw err
    }
  }
  static async select(menu) {
    try {
      const { userId, _id: menuId } = menu
      await menu_model_1.Menu.updateMany(
        { userId },
        { $set: { isSelected: false } }
      )
      const savedMenu = await menu_model_1.Menu.findByIdAndUpdate(
        menuId,
        { isSelected: true },
        { new: true }
      ).populate('menuLogs')
      return savedMenu
    } catch (err) {
      logger_service_1.logger.error(`Failed to select menu ${menu._id}`, err)
      throw err
    }
  }
}
exports.MenuService = MenuService
