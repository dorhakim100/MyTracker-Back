"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveGoogleLinkOrCreateAction = resolveGoogleLinkOrCreateAction;
function resolveGoogleLinkOrCreateAction(existingByGoogleId, existingByEmail, profile) {
    if (existingByGoogleId) {
        return { type: 'login', userId: existingByGoogleId._id };
    }
    if (existingByEmail) {
        if (existingByEmail.googleId &&
            existingByEmail.googleId !== profile.googleId) {
            throw new Error('This email is already linked to a different Google account');
        }
        return { type: 'link', userId: existingByEmail._id };
    }
    return { type: 'create', profile };
}
