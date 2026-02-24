"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuService = void 0;
const menu_model_1 = require("./menu.model");
const logger_service_1 = require("../../services/logger.service");
class MenuService {
    static async query(filterBy = {}) {
        try {
            const menus = await menu_model_1.Menu.find(filterBy).populate('menuLogs');
            return menus;
        }
        catch (err) {
            logger_service_1.logger.error('Failed to query menus', err);
            throw err;
        }
    }
    static async getById(menuId) {
        try {
            const menu = await menu_model_1.Menu.findById(menuId).populate('menuLogs');
            return menu;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to get menu ${menuId}`, err);
            throw err;
        }
    }
    static async getByUserId(userId) {
        try {
            const menus = await menu_model_1.Menu.find({ userId }).populate('menuLogs');
            return menus;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to get menus for user ${userId}`, err);
            throw err;
        }
    }
    static async add(menu) {
        try {
            const addedMenu = await menu_model_1.Menu.create(menu);
            return addedMenu.populate('menuLogs');
        }
        catch (err) {
            logger_service_1.logger.error('Failed to add menu', err);
            throw err;
        }
    }
    static async update(menuId, menuToUpdate) {
        try {
            const menu = await menu_model_1.Menu.findByIdAndUpdate(menuId, menuToUpdate, {
                new: true,
            }).populate('menuLogs');
            return menu;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to update menu ${menuId}`, err);
            throw err;
        }
    }
    static async remove(menuId) {
        try {
            await menu_model_1.Menu.findByIdAndDelete(menuId);
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to remove menu ${menuId}`, err);
            throw err;
        }
    }
}
exports.MenuService = MenuService;
