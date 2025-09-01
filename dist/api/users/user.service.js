"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const user_model_1 = require("./user.model");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class UserService {
    static async createUser(userData) {
        const userExists = await user_model_1.User.findOne({ email: userData.email });
        if (userExists) {
            throw new Error('User already exists');
        }
        return user_model_1.User.create(userData);
    }
    static async loginUser(email, password) {
        const user = await user_model_1.User.findOne({ email });
        if (!user) {
            throw new Error('User not found');
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }
        const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });
        return { user, token };
    }
    static async getUserById(id) {
        return user_model_1.User.findById(id);
    }
    static async updateUser(id, updateData) {
        return user_model_1.User.findByIdAndUpdate(id, updateData, { new: true });
    }
    static async deleteUser(id) {
        return user_model_1.User.findByIdAndDelete(id);
    }
}
exports.UserService = UserService;
