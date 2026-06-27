"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleHealthService = void 0;
const user_model_1 = require("../user/user.model");
const google_oauth_service_1 = require("../auth/google-oauth.service");
const logger_service_1 = require("../../services/logger.service");
const google_health_normalize_1 = require("./google-health.normalize");
const GOOGLE_HEALTH_BASE_URL = 'https://health.googleapis.com/v4';
class GoogleHealthService {
    static async getStatus(userId) {
        const user = await user_model_1.User.findById(userId).select('+googleRefreshToken googleId email googleHealthConnectedAt');
        if (!user?.googleId || !user.googleRefreshToken) {
            return {
                connected: false,
                googleEmail: user?.email ?? null,
                provider: null,
            };
        }
        return {
            connected: true,
            googleEmail: user.email,
            provider: 'google',
        };
    }
    static async getTodayActivitySummary(userId) {
        const status = await GoogleHealthService.getStatus(userId);
        if (!status.connected) {
            return { status: 'not_connected' };
        }
        try {
            const accessToken = await google_oauth_service_1.GoogleOAuthService.getAccessTokenForUser(userId);
            const window = getLocalTodayWindow();
            const start = toCivilDateTime(window.start);
            const end = toCivilDateTime(window.endExclusive);
            const [stepsRollup, distanceRollup, floorsRollup, activeEnergyRollup, totalCaloriesRollup] = await Promise.all([
                GoogleHealthService.fetchDailyRollUp(accessToken, 'steps', start, end),
                GoogleHealthService.fetchDailyRollUp(accessToken, 'distance', start, end),
                GoogleHealthService.fetchDailyRollUp(accessToken, 'floors', start, end),
                GoogleHealthService.fetchDailyRollUp(accessToken, 'active-energy-burned', start, end),
                GoogleHealthService.fetchDailyRollUp(accessToken, 'total-calories', start, end),
            ]);
            return {
                status: 'ok',
                steps: (0, google_health_normalize_1.roundValue)((0, google_health_normalize_1.extractSteps)(stepsRollup.rollupDataPoints)),
                activeCaloriesKcal: (0, google_health_normalize_1.roundValue)((0, google_health_normalize_1.extractActiveCalories)(activeEnergyRollup.rollupDataPoints, totalCaloriesRollup.rollupDataPoints)),
                distance: (0, google_health_normalize_1.roundValue)((0, google_health_normalize_1.extractDistanceKm)(distanceRollup.rollupDataPoints), 2),
                flightsClimbed: (0, google_health_normalize_1.roundValue)((0, google_health_normalize_1.extractFloors)(floorsRollup.rollupDataPoints)),
                window: {
                    startIso: window.start.toISOString(),
                    endIso: window.endExclusive.toISOString(),
                },
            };
        }
        catch (err) {
            logger_service_1.logger.error('Failed to fetch Google Health activity summary', err);
            return {
                status: 'error',
                message: err instanceof Error ? err.message : 'Failed to fetch Google Health data',
            };
        }
    }
    static async fetchDailyRollUp(accessToken, dataType, start, end) {
        const body = {
            range: { start, end },
            windowSizeDays: 1,
        };
        const response = await fetch(`${GOOGLE_HEALTH_BASE_URL}/users/me/dataTypes/${dataType}/dataPoints:dailyRollUp`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Google Health API ${dataType} failed (${response.status}): ${errorBody}`);
        }
        return (await response.json());
    }
}
exports.GoogleHealthService = GoogleHealthService;
function getLocalTodayWindow() {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endExclusive = new Date(start);
    endExclusive.setDate(endExclusive.getDate() + 1);
    return { start, endExclusive, now };
}
function toCivilDateTime(date) {
    return {
        date: {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
        },
        time: { hours: 0, minutes: 0, seconds: 0, nanos: 0 },
    };
}
