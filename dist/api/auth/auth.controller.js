"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const logger_service_1 = require("../../services/logger.service");
const day_service_1 = require("../day/day.service");
class AuthController {
    static async login(req, res) {
        const { email, password } = req.body;
        try {
            const user = await auth_service_1.AuthService.login(email, password);
            const loginToken = auth_service_1.AuthService.getLoginToken(user);
            res.cookie('loginToken', loginToken, { sameSite: 'none', secure: true });
            res.json(user);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to Login ' + err);
            res.status(401).send({ err: 'Failed to Login' });
        }
    }
    static async signup(req, res) {
        try {
            const credentials = req.body;
            console.log('credentials', credentials);
            const account = await auth_service_1.AuthService.signup(credentials);
            const loginToken = auth_service_1.AuthService.getLoginToken(account);
            res.cookie('loginToken', loginToken, { sameSite: 'none', secure: true });
            const loggedToday = await day_service_1.DayService.getById(account.loggedToday);
            console.log('loggedToday', loggedToday);
            console.log('account', account);
            const accountToReturn = {
                ...account,
                loggedToday: loggedToday,
            };
            //console.log('accountToReturn', accountToReturn)
            res.json(accountToReturn);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to signup ' + err);
            res.status(400).send({ err: 'Failed to signup' });
        }
    }
    static async logout(req, res) {
        try {
            res.clearCookie('loginToken');
            res.send({ msg: 'Logged out successfully' });
        }
        catch (err) {
            res.status(500).send({ err: 'Failed to logout' });
        }
    }
}
exports.AuthController = AuthController;
