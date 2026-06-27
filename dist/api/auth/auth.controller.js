"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_service_1 = require("./auth.service");
const google_oauth_service_1 = require("./google-oauth.service");
const logger_service_1 = require("../../services/logger.service");
const day_service_1 = require("../day/day.service");
class AuthController {
    static async login(req, res) {
        const { email, password } = req.body;
        try {
            const user = await auth_service_1.AuthService.login(email, password);
            const loginToken = auth_service_1.AuthService.getLoginToken(user);
            res.cookie('loginToken', loginToken, { sameSite: 'none', secure: true });
            res.json({ user, loginToken });
        }
        catch (err) {
            logger_service_1.logger.error('Failed to Login ' + err);
            res.status(400).send({ err: 'Failed to Login' });
        }
    }
    static async signup(req, res) {
        try {
            const credentials = req.body;
            const account = await auth_service_1.AuthService.signup(credentials);
            const loginToken = auth_service_1.AuthService.getLoginToken(account);
            res.cookie('loginToken', loginToken, { sameSite: 'none', secure: true });
            const loggedToday = await day_service_1.DayService.getById(account.loggedToday);
            const accountToReturn = {
                ...account,
                loggedToday: loggedToday,
            };
            res.json({ user: accountToReturn, loginToken });
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
            logger_service_1.logger.error('Failed to logout ' + err);
            res.status(500).send({ err: 'Failed to logout' });
        }
    }
    static googleAuth(req, res) {
        try {
            const intent = req.query.intent === 'connect' ? 'connect' : 'login';
            const returnTo = typeof req.query.returnTo === 'string' ? req.query.returnTo : undefined;
            let userId;
            if (intent === 'connect') {
                const cookieToken = req.cookies.loginToken;
                const authHeader = req.headers.authorization;
                const headerToken = authHeader?.startsWith('Bearer ')
                    ? authHeader.slice(7)
                    : null;
                const loginToken = cookieToken || headerToken;
                if (!loginToken) {
                    return res.status(401).send({ err: 'Not authenticated' });
                }
                const decoded = jsonwebtoken_1.default.verify(loginToken, process.env.JWT_SECRET);
                userId = decoded._id;
                if (!userId) {
                    return res.status(401).send({ err: 'Not authenticated' });
                }
            }
            const url = google_oauth_service_1.GoogleOAuthService.getAuthorizationUrl(intent, returnTo, userId);
            res.redirect(url);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to start Google OAuth ' + err);
            res.status(500).send({ err: 'Failed to start Google OAuth' });
        }
    }
    static getFrontendUrl() {
        if (process.env.NODE_ENV === 'production') {
            return (process.env.FRONTEND_URL_PROD || 'https://mytracker-j6fc.onrender.com');
        }
        return process.env.FRONTEND_URL_DEV || 'http://localhost:5173';
    }
    static getGoogleConnectUrl(req, res) {
        try {
            const userId = req.user?._id;
            if (!userId) {
                return res.status(401).send({ err: 'Not authenticated' });
            }
            const returnTo = typeof req.body?.returnTo === 'string' ? req.body.returnTo : undefined;
            const url = google_oauth_service_1.GoogleOAuthService.getAuthorizationUrl('connect', returnTo, userId);
            res.json({ url });
        }
        catch (err) {
            logger_service_1.logger.error('Failed to create Google connect URL ' + err);
            res.status(500).send({ err: 'Failed to create Google connect URL' });
        }
    }
    static async googleCallback(req, res) {
        const { code, state, error } = req.query;
        const frontendUrl = AuthController.getFrontendUrl();
        if (error) {
            logger_service_1.logger.error('Google OAuth denied ' + error);
            const redirectUrl = new URL('/auth/google/callback', frontendUrl);
            redirectUrl.searchParams.set('error', String(error));
            return res.redirect(redirectUrl.toString());
        }
        if (typeof code !== 'string' || typeof state !== 'string') {
            return res.status(400).send({ err: 'Missing Google OAuth parameters' });
        }
        try {
            const redirectUrl = await google_oauth_service_1.GoogleOAuthService.handleCallback(code, state);
            res.redirect(redirectUrl);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to complete Google OAuth ' + err);
            const redirectUrl = new URL('/auth/google/callback', frontendUrl);
            redirectUrl.searchParams.set('error', 'oauth_failed');
            res.redirect(redirectUrl.toString());
        }
    }
    static async completeGoogleAuth(req, res) {
        const { code } = req.body;
        if (!code || typeof code !== 'string') {
            return res.status(400).send({ err: 'Missing Google login code' });
        }
        try {
            const { user, loginToken } = await google_oauth_service_1.GoogleOAuthService.exchangePendingCode(code);
            res.cookie('loginToken', loginToken, { sameSite: 'none', secure: true });
            res.json({ user, loginToken });
        }
        catch (err) {
            logger_service_1.logger.error('Failed to complete Google login ' + err);
            res.status(400).send({ err: 'Failed to complete Google login' });
        }
    }
}
exports.AuthController = AuthController;
