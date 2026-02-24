"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const protect = async (req, res, next) => {
    let token;
    const cookieToken = req.cookies.loginToken;
    const authHeader = req.headers.authorization;
    const headerToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;
    const loginToken = cookieToken || headerToken;
    if (
    // req.headers.authorization &&
    // req.headers.authorization.startsWith('Bearer')
    loginToken) {
        try {
            // Get token from header
            // token = req.headers.authorization.split(' ')[1]
            token = loginToken;
            // Verify token
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            if (decoded.isGuest)
                res.status(401).json({ message: 'Not authorized, token failed' });
            // Add user from payload
            req.user = decoded;
            next();
        }
        catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
            return;
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }
};
exports.protect = protect;
function requireAuth(req, res, next) {
    const cookieToken = req.cookies.loginToken;
    const authHeader = req.headers.authorization;
    const headerToken = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;
    const token = cookieToken || headerToken;
    if (!token)
        return res.status(401).send('Not Authenticated');
    // Verify token
    const loggedinUser = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
    if (!loggedinUser)
        return res.status(401).send('Not Authenticated');
    const { id, userId } = req.body;
    if (id !== loggedinUser.id)
        return res.status(401).send('Not Authenticated');
    // if (config.isGuestMode && !loggedinUser) {
    //   req.loggedinUser = { _id: '', fullname: 'Guest' }
    //   return next()
    // }
    next();
}
