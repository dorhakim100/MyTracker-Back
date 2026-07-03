"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_DAILY_STEPS_GOAL = exports.MIN_DAILY_STEPS_GOAL = exports.DEFAULT_DAILY_STEPS_GOAL = void 0;
exports.normalizeDailyStepsGoal = normalizeDailyStepsGoal;
exports.normalizeUserDetails = normalizeUserDetails;
exports.applyDailyStepsGoalUpdate = applyDailyStepsGoalUpdate;
exports.DEFAULT_DAILY_STEPS_GOAL = 10000;
exports.MIN_DAILY_STEPS_GOAL = 1000;
exports.MAX_DAILY_STEPS_GOAL = 100000;
function normalizeDailyStepsGoal(value) {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) {
        throw new Error('dailyStepsGoal must be a number');
    }
    const rounded = Math.round(parsed);
    if (rounded < exports.MIN_DAILY_STEPS_GOAL || rounded > exports.MAX_DAILY_STEPS_GOAL) {
        throw new Error(`dailyStepsGoal must be between ${exports.MIN_DAILY_STEPS_GOAL} and ${exports.MAX_DAILY_STEPS_GOAL}`);
    }
    return rounded;
}
function normalizeUserDetails(details) {
    return {
        ...details,
        dailyStepsGoal: normalizeDailyStepsGoal(details.dailyStepsGoal ?? exports.DEFAULT_DAILY_STEPS_GOAL),
    };
}
function applyDailyStepsGoalUpdate(existingDetails, incomingDetails) {
    if (incomingDetails.dailyStepsGoal === undefined) {
        return {
            ...existingDetails,
            ...incomingDetails,
            dailyStepsGoal: normalizeDailyStepsGoal(existingDetails.dailyStepsGoal ?? exports.DEFAULT_DAILY_STEPS_GOAL),
        };
    }
    return {
        ...existingDetails,
        ...incomingDetails,
        dailyStepsGoal: normalizeDailyStepsGoal(incomingDetails.dailyStepsGoal),
    };
}
