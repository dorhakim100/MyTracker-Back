"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../user/user.model");
const logger_service_1 = require("../../services/logger.service");
const day_service_1 = require("../day/day.service");
const user_service_1 = require("../user/user.service");
class AuthService {
    static async login(email, password) {
        const user = await user_model_1.User.findOne({ email });
        if (!user)
            throw new Error('Invalid email or password');
        const match = await bcryptjs_1.default.compare(password, user.password);
        if (!match)
            throw new Error('Invalid email or password');
        const aggregatedUser = await user_service_1.UserService.getById(user._id);
        delete aggregatedUser.password;
        return aggregatedUser;
    }
    static async signup(credentials) {
        const saltRounds = 10;
        logger_service_1.logger.debug(`Auth.signup: ${credentials.email}`);
        if (!credentials.email || !credentials.password || !credentials.fullname)
            throw new Error('Missing required signup information');
        const userExist = await user_model_1.User.findOne({ email: credentials.email });
        console.log('userExist', userExist);
        if (userExist)
            throw new Error('Email already exists');
        const hash = await bcryptjs_1.default.hash(credentials.password, saltRounds);
        credentials.password = hash;
        const defaultLoggedToday = day_service_1.DayService.getDefaultLoggedToday();
        const user = await user_model_1.User.create({
            ...credentials,
            loggedToday: defaultLoggedToday._id,
        });
        const createdDay = await day_service_1.DayService.add(defaultLoggedToday, user._id);
        const userObj = user.toObject();
        delete userObj.password;
        userObj.loggedToday = createdDay;
        return userObj;
    }
    static getLoginToken(user) {
        const userInfo = {
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
        };
        return jsonwebtoken_1.default.sign(userInfo, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });
    }
}
exports.AuthService = AuthService;
