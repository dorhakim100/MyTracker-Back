"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MenuController = void 0;
const menu_service_1 = require("./menu.service");
const logger_service_1 = require("../../services/logger.service");
class MenuController {
    static async getMenus(req, res) {
        try {
            const menus = await menu_service_1.MenuService.query(req.query);
            res.json(menus);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get menus', err);
            res.status(500).send({ err: 'Failed to get menus' });
        }
    }
    static async getMenu(req, res) {
        try {
            const menu = await menu_service_1.MenuService.getById(req.params.id);
            res.json(menu);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get menu', err);
            res.status(500).send({ err: 'Failed to get menu' });
        }
    }
    static async getMenusByUser(req, res) {
        try {
            const menus = await menu_service_1.MenuService.getByUserId(req.params.userId);
            res.json(menus);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get menus by user', err);
            res.status(500).send({ err: 'Failed to get menus by user' });
        }
    }
    static async addMenu(req, res) {
        try {
            const menu = req.body;
            const addedMenu = await menu_service_1.MenuService.add(menu);
            res.json(addedMenu);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to add menu', err);
            res.status(500).send({ err: 'Failed to add menu' });
        }
    }
    static async updateMenu(req, res) {
        try {
            const menu = await menu_service_1.MenuService.update(req.params.id, req.body);
            res.json(menu);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to update menu', err);
            res.status(500).send({ err: 'Failed to update menu' });
        }
    }
    static async deleteMenu(req, res) {
        try {
            await menu_service_1.MenuService.remove(req.params.id);
            res.send({ msg: 'Deleted successfully' });
        }
        catch (err) {
            logger_service_1.logger.error('Failed to delete menu', err);
            res.status(500).send({ err: 'Failed to delete menu' });
        }
    }
}
exports.MenuController = MenuController;
