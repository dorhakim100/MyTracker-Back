"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("./user.service");
const logger_service_1 = require("../../services/logger.service");
const auth_service_1 = require("../auth/auth.service");
class UserController {
    static async getUsers(req, res) {
        try {
            const users = await user_service_1.UserService.query();
            res.json(users);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get users', err);
            res.status(500).send({ err: 'Failed to get users' });
        }
    }
    static async rememberUser(req, res) {
        try {
            const user = await user_service_1.UserService.getById(req.params.id);
            const loginToken = auth_service_1.AuthService.getLoginToken(user);
            res.cookie('loginToken', loginToken, { sameSite: 'none', secure: true });
            res.json(user);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to remember user', err);
            res.status(500).send({ err: 'Failed to remember user' });
        }
    }
    static async getUser(req, res) {
        try {
            const user = await user_service_1.UserService.getById(req.params.id);
            res.json(user);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get user', err);
            res.status(500).send({ err: 'Failed to get user' });
        }
    }
    static async updateUser(req, res) {
        try {
            const user = await user_service_1.UserService.update(req.params.id, req.body);
            res.json(user);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to update user', err);
            res.status(500).send({ err: 'Failed to update user' });
        }
    }
    static async deleteUser(req, res) {
        try {
            await user_service_1.UserService.remove(req.params.id);
            res.send({ msg: 'Deleted successfully' });
        }
        catch (err) {
            logger_service_1.logger.error('Failed to delete user', err);
            res.status(500).send({ err: 'Failed to delete user' });
        }
    }
}
exports.UserController = UserController;
