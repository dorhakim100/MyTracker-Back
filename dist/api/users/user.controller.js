"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("./user.service");
class UserController {
    static async register(req, res) {
        try {
            const user = await user_service_1.UserService.createUser(req.body);
            res.status(201).json(user);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            const { user, token } = await user_service_1.UserService.loginUser(email, password);
            res.json({ user, token });
        }
        catch (error) {
            res.status(401).json({ message: error.message });
        }
    }
    static async getProfile(req, res) {
        try {
            const user = await user_service_1.UserService.getUserById(req.user.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    static async updateProfile(req, res) {
        try {
            const user = await user_service_1.UserService.updateUser(req.user.id, req.body);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json(user);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    static async deleteProfile(req, res) {
        try {
            const user = await user_service_1.UserService.deleteUser(req.user.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            res.json({ message: 'User deleted successfully' });
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}
exports.UserController = UserController;
