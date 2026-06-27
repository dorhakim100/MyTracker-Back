"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleOAuthService = void 0;
exports.__clearPendingAuthCodesForTests = __clearPendingAuthCodesForTests;
const crypto_1 = __importDefault(require("crypto"));
const google_auth_library_1 = require("google-auth-library");
const user_model_1 = require("../user/user.model");
const user_service_1 = require("../user/user.service");
const day_service_1 = require("../day/day.service");
const token_crypto_service_1 = require("../../services/token-crypto.service");
const google_oauth_logic_1 = require("./google-oauth.logic");
const auth_service_1 = require("./auth.service");
const token_crypto_service_2 = require("../../services/token-crypto.service");
const BASE_OAUTH_SCOPES = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
];
const GOOGLE_HEALTH_READ_SCOPE = 'https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly';
const OAUTH_SCOPES = [...BASE_OAUTH_SCOPES, GOOGLE_HEALTH_READ_SCOPE];
const pendingAuthCodes = new Map();
function getOAuthClient() {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const redirectUri = process.env.NODE_ENV === 'production'
        ? process.env.GOOGLE_OAUTH_REDIRECT_URI_PROD
        : process.env.GOOGLE_OAUTH_REDIRECT_URI_DEV;
    if (!clientId || !clientSecret || !redirectUri) {
        throw new Error('Google OAuth environment variables are not configured');
    }
    return new google_auth_library_1.OAuth2Client(clientId, clientSecret, redirectUri);
}
function getFrontendUrl() {
    if (process.env.NODE_ENV === 'production') {
        return (process.env.FRONTEND_URL_PROD || 'https://mytracker-j6fc.onrender.com');
    }
    return process.env.FRONTEND_URL_DEV || 'http://localhost:5173';
}
function encodeState(payload) {
    return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
}
function decodeState(state) {
    try {
        const parsed = JSON.parse(Buffer.from(state, 'base64url').toString('utf8'));
        if (!parsed.intent || !parsed.nonce) {
            throw new Error('Invalid OAuth state');
        }
        return parsed;
    }
    catch {
        throw new Error('Invalid OAuth state');
    }
}
function cleanupExpiredPendingCodes() {
    const now = Date.now();
    for (const [code, payload] of pendingAuthCodes.entries()) {
        if (payload.expiresAt <= now) {
            pendingAuthCodes.delete(code);
        }
    }
}
function createPendingAuthCode(userId, loginToken) {
    cleanupExpiredPendingCodes();
    const code = crypto_1.default.randomBytes(24).toString('base64url');
    pendingAuthCodes.set(code, {
        userId,
        loginToken,
        expiresAt: Date.now() + 60000,
    });
    return code;
}
function buildGoogleProfile(payload) {
    if (!payload.sub || !payload.email) {
        throw new Error('Google account is missing required profile fields');
    }
    return {
        googleId: payload.sub,
        email: payload.email.toLowerCase(),
        fullname: payload.name?.trim() || payload.email.split('@')[0],
        picture: payload.picture || undefined,
    };
}
class GoogleOAuthService {
    static getAuthorizationUrl(intent, returnTo, userId) {
        const client = getOAuthClient();
        const state = encodeState({
            intent,
            nonce: crypto_1.default.randomBytes(16).toString('hex'),
            returnTo,
            userId,
        });
        return client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: OAUTH_SCOPES,
            state,
        });
    }
    static async handleCallback(code, state) {
        const statePayload = decodeState(state);
        const client = getOAuthClient();
        const { tokens } = await client.getToken(code);
        if (!tokens.id_token) {
            throw new Error('Google OAuth response did not include an ID token');
        }
        const ticket = await client.verifyIdToken({
            idToken: tokens.id_token,
            audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
        });
        const profile = buildGoogleProfile(ticket.getPayload() || {});
        const refreshToken = tokens.refresh_token
            ? (0, token_crypto_service_1.encryptToken)(tokens.refresh_token)
            : undefined;
        if (statePayload.intent === 'connect') {
            if (!statePayload.userId) {
                throw new Error('Missing user for Google Health connect flow');
            }
            await GoogleOAuthService.linkGoogleHealthToUser(statePayload.userId, profile, refreshToken);
            const redirectUrl = new URL('/auth/google/callback', getFrontendUrl());
            redirectUrl.searchParams.set('connected', '1');
            if (statePayload.returnTo) {
                redirectUrl.searchParams.set('returnTo', statePayload.returnTo);
            }
            return redirectUrl.toString();
        }
        const user = await GoogleOAuthService.linkOrCreateUser(profile, refreshToken);
        const loginToken = GoogleOAuthService.getLoginTokenForUser(user);
        const pendingCode = createPendingAuthCode(String(user._id), loginToken);
        const redirectUrl = new URL('/auth/google/callback', getFrontendUrl());
        redirectUrl.searchParams.set('code', pendingCode);
        if (statePayload.returnTo) {
            redirectUrl.searchParams.set('returnTo', statePayload.returnTo);
        }
        return redirectUrl.toString();
    }
    static async exchangePendingCode(code) {
        cleanupExpiredPendingCodes();
        const pending = pendingAuthCodes.get(code);
        if (!pending) {
            throw new Error('Invalid or expired Google login code');
        }
        pendingAuthCodes.delete(code);
        const user = await user_service_1.UserService.getById(pending.userId);
        delete user.password;
        return {
            user,
            loginToken: pending.loginToken,
        };
    }
    static async linkOrCreateUser(profile, encryptedRefreshToken) {
        const existingByGoogleId = await user_model_1.User.findOne({
            googleId: profile.googleId,
        });
        const existingByEmail = await user_model_1.User.findOne({ email: profile.email });
        const action = (0, google_oauth_logic_1.resolveGoogleLinkOrCreateAction)(existingByGoogleId
            ? {
                _id: String(existingByGoogleId._id),
                googleId: existingByGoogleId.googleId,
            }
            : null, existingByEmail
            ? {
                _id: String(existingByEmail._id),
                googleId: existingByEmail.googleId,
                email: existingByEmail.email,
            }
            : null, profile);
        let user = null;
        switch (action.type) {
            case 'login':
                user = await user_model_1.User.findById(action.userId);
                break;
            case 'link':
                user = await user_model_1.User.findByIdAndUpdate(action.userId, {
                    googleId: profile.googleId,
                    ...(encryptedRefreshToken
                        ? {
                            googleRefreshToken: encryptedRefreshToken,
                            googleHealthConnectedAt: new Date(),
                        }
                        : {}),
                    'details.fullname': profile.fullname ||
                        existingByEmail?.details?.fullname ||
                        profile.email,
                    ...(profile.picture ? { 'details.imgUrl': profile.picture } : {}),
                }, { new: true });
                break;
            case 'create': {
                const defaultLoggedToday = day_service_1.DayService.getDefaultLoggedToday();
                user = await user_model_1.User.create({
                    email: profile.email,
                    googleId: profile.googleId,
                    googleRefreshToken: encryptedRefreshToken,
                    googleHealthConnectedAt: encryptedRefreshToken ? new Date() : undefined,
                    details: {
                        fullname: profile.fullname,
                        imgUrl: profile.picture ||
                            'https://cdn.pixabay.com/photo/2020/07/01/12/58/icon-5359553_1280.png',
                        birthdate: 946684800000,
                        height: 170,
                        gender: 'male',
                        activity: 'sedentary',
                    },
                    loggedToday: defaultLoggedToday._id,
                });
                await day_service_1.DayService.add(defaultLoggedToday, String(user._id));
                break;
            }
        }
        if (!user) {
            throw new Error('Failed to resolve Google user');
        }
        if (encryptedRefreshToken && action.type === 'login') {
            await user_model_1.User.findByIdAndUpdate(user._id, {
                googleRefreshToken: encryptedRefreshToken,
                googleHealthConnectedAt: new Date(),
            });
        }
        const aggregatedUser = await user_service_1.UserService.getById(String(user._id));
        delete aggregatedUser.password;
        return aggregatedUser;
    }
    static getLoginTokenForUser(user) {
        return auth_service_1.AuthService.getLoginToken(user);
    }
    static async getAccessTokenForUser(userId) {
        const user = await user_model_1.User.findById(userId).select('+googleRefreshToken');
        if (!user?.googleRefreshToken) {
            throw new Error('Google Health not connected');
        }
        const client = getOAuthClient();
        client.setCredentials({
            refresh_token: (0, token_crypto_service_2.decryptToken)(user.googleRefreshToken),
        });
        const { credentials } = await client.refreshAccessToken();
        if (!credentials.access_token) {
            throw new Error('Failed to refresh Google access token');
        }
        return credentials.access_token;
    }
    static async linkGoogleHealthToUser(userId, profile, encryptedRefreshToken) {
        const user = await user_model_1.User.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }
        if (user.googleId &&
            user.googleId !== profile.googleId) {
            throw new Error('This account is already linked to a different Google account');
        }
        const existingByGoogleId = await user_model_1.User.findOne({
            googleId: profile.googleId,
            _id: { $ne: userId },
        });
        if (existingByGoogleId) {
            throw new Error('This Google account is already linked to another user');
        }
        await user_model_1.User.findByIdAndUpdate(userId, {
            googleId: profile.googleId,
            ...(encryptedRefreshToken
                ? {
                    googleRefreshToken: encryptedRefreshToken,
                    googleHealthConnectedAt: new Date(),
                }
                : {}),
            ...(profile.picture ? { 'details.imgUrl': profile.picture } : {}),
        });
    }
}
exports.GoogleOAuthService = GoogleOAuthService;
function __clearPendingAuthCodesForTests() {
    pendingAuthCodes.clear();
}
