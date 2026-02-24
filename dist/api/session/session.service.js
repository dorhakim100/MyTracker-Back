"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionService = void 0;
const session_model_1 = require("./session.model");
const mongoose_1 = __importDefault(require("mongoose"));
const logger_service_1 = require("../../services/logger.service");
const utils_1 = require("../../services/utils");
const instructions_service_1 = require("../instructions/instructions.service");
const set_service_1 = require("../set/set.service");
const workout_service_1 = require("../workout/workout.service");
class SessionService {
    static getWorkoutLookupPipeline() {
        return [
            {
                $addFields: {
                    workoutObjectId: {
                        $cond: [
                            { $eq: [{ $type: '$workoutId' }, 'string'] },
                            { $toObjectId: '$workoutId' },
                            '$workoutId',
                        ],
                    },
                },
            },
            {
                $lookup: {
                    from: 'workouts',
                    localField: 'workoutObjectId',
                    foreignField: '_id',
                    as: 'workout',
                },
            },
            {
                $addFields: {
                    workout: { $arrayElemAt: ['$workout', 0] },
                    userId: '$workout.userId',
                },
            },
        ];
    }
    static getInstructionsLookupPipeline() {
        return [
            {
                $addFields: {
                    instructionsObjectId: {
                        $cond: [
                            { $eq: [{ $type: '$instructionsId' }, 'string'] },
                            { $toObjectId: '$instructionsId' },
                            '$instructionsId',
                        ],
                    },
                },
            },
            {
                $lookup: {
                    from: 'instructions',
                    localField: 'instructionsObjectId',
                    foreignField: '_id',
                    as: 'instructions',
                },
            },
            {
                $addFields: {
                    instructions: { $arrayElemAt: ['$instructions', 0] },
                },
            },
        ];
    }
    static getCommonProjection() {
        return [
            {
                $project: {
                    workoutObjectId: 0,
                    instructionsObjectId: 0,
                    setsIds: 0,
                    setObjectIds: 0,
                },
            },
        ];
    }
    static async getById(sessionId) {
        try {
            const session = await session_model_1.Session.aggregate([
                { $match: { _id: new mongoose_1.default.Types.ObjectId(sessionId) } },
                ...this.getWorkoutLookupPipeline(),
                ...this.getInstructionsLookupPipeline(),
                ...this.getCommonProjection(),
            ]);
            const instructions = await instructions_service_1.InstructionsService.getNextInstructionsByWorkoutId({
                workoutId: session[0].workoutId,
            });
            const sessionToSend = {
                ...session[0],
                instructions,
            };
            return sessionToSend || null;
        }
        catch (err) {
            logger_service_1.logger.error(`SessionService.getById failed for ${sessionId}`, err);
            throw err;
        }
    }
    static async playWorkout(sessionId, workoutId, userId) {
        try {
            const instructions = await instructions_service_1.InstructionsService.getNextInstructionsByWorkoutIdAndUpdate({
                workoutId,
            });
            if (!instructions)
                return null;
            // Fire and forget - sets creation can take time, don't block the response
            this.handleSetsCreation(instructions.exercises, sessionId, userId).catch((err) => {
                logger_service_1.logger.error(`Failed to create sets in background for session ${sessionId}`, err);
            });
            const instructionsId = instructions?._id;
            const updatedSession = await session_model_1.Session.findByIdAndUpdate(sessionId, { workoutId, instructionsId }, { new: true });
            if (!updatedSession) {
                return null;
            }
            const sessiionToModify = await this.getById(sessionId);
            if (!sessiionToModify)
                return null;
            const sessionToSend = {
                ...sessiionToModify,
                instructions,
            };
            return sessionToSend || null;
        }
        catch (err) {
            logger_service_1.logger.error(`SessionService.getById failed for ${sessionId}`, err);
            throw err;
        }
    }
    static async playEmptyWorkout(userId) {
        try {
            let session;
            const sessionQuery = await this.query({
                userId,
                date: (0, utils_1.getDateFromISO)(new Date().toISOString()),
            });
            if (!sessionQuery[0]) {
                session = await this.add({
                    userId,
                    date: (0, utils_1.getDateFromISO)(new Date().toISOString()),
                });
            }
            else
                session = sessionQuery[0];
            const emptyWorkout = await workout_service_1.WorkoutService.add(workout_service_1.WorkoutService.getEmptyWorkout(userId));
            const emptyWorkoutId = emptyWorkout._id;
            const emptyInstructions = await instructions_service_1.InstructionsService.add(instructions_service_1.InstructionsService.getEmptyInstructions(emptyWorkoutId));
            if (!emptyInstructions || !emptyWorkout)
                return null;
            const sessionToUpdate = {
                ...session,
                instructionsId: emptyInstructions._id,
                workoutId: emptyWorkout._id,
                userId,
            };
            const updatedSession = await this.update(session._id, sessionToUpdate);
            return updatedSession || null;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to play empty workout for user ${userId}`, err);
            throw err;
        }
    }
    static async getByUserAndDate(userId, date) {
        try {
            const dateFromISO = (0, utils_1.getDateFromISO)(date);
            const sessions = await session_model_1.Session.aggregate([
                { $match: { userId, date: dateFromISO } },
                ...this.getWorkoutLookupPipeline(),
                ...this.getInstructionsLookupPipeline(),
                ...this.getCommonProjection(),
                { $sort: { createdAt: -1 } },
            ]);
            const sessionResult = sessions[0];
            if (!sessionResult) {
                const newSession = await this.add({ userId, date });
                return newSession || null;
            }
            if (!sessionResult.workoutId) {
                return sessionResult || null;
            }
            if (sessionResult.instructions)
                return sessionResult || null;
            const instructions = await instructions_service_1.InstructionsService.getNextInstructionsByWorkoutId({
                workoutId: sessions[0].workoutId,
            });
            const sessionToSend = {
                ...sessionResult,
                instructions,
            };
            return sessionToSend || null;
        }
        catch (err) {
            logger_service_1.logger.error(`SessionService.getByUserAndDate failed for user ${userId} date ${date}`, err);
            throw err;
        }
    }
    static async listByUser(userId, limit = 30, filterBy = {}) {
        try {
            const matchQuery = { userId, ...filterBy };
            const sessions = await session_model_1.Session.aggregate([
                { $match: matchQuery },
                ...this.getWorkoutLookupPipeline(),
                ...this.getCommonProjection(),
                { $sort: { date: -1, createdAt: -1 } },
                { $limit: limit },
            ]);
            return sessions;
        }
        catch (err) {
            logger_service_1.logger.error(`SessionService.listByUser failed for ${userId}`, err);
            throw err;
        }
    }
    static async query(filterBy = {}) {
        try {
            const sessions = await session_model_1.Session.aggregate([
                { $match: filterBy },
                ...this.getWorkoutLookupPipeline(),
                ...this.getCommonProjection(),
                { $sort: { date: -1, createdAt: -1 } },
            ]);
            return sessions;
        }
        catch (err) {
            logger_service_1.logger.error('SessionService.query failed', err);
            throw err;
        }
    }
    static async add(session) {
        try {
            if (session.date) {
                session.date = (0, utils_1.getDateFromISO)(session.date);
            }
            const addedSession = await session_model_1.Session.create(session);
            return addedSession;
        }
        catch (err) {
            logger_service_1.logger.error('SessionService.add failed', err);
            throw err;
        }
    }
    static async update(sessionId, sessionToUpdate) {
        try {
            if (sessionToUpdate.date) {
                sessionToUpdate.date = (0, utils_1.getDateFromISO)(sessionToUpdate.date);
            }
            await session_model_1.Session.findByIdAndUpdate(sessionId, sessionToUpdate, { new: true });
            const session = await this.getById(sessionId);
            return session;
        }
        catch (err) {
            logger_service_1.logger.error(`SessionService.update failed for ${sessionId}`, err);
            throw err;
        }
    }
    static async remove(sessionId) {
        try {
            const session = await this.getById(sessionId);
            if (session?.instructionsId) {
                await instructions_service_1.InstructionsService.undoPlayWorkout(session.instructionsId);
                await set_service_1.SetService.removeBySessionId(sessionId);
            }
            await session_model_1.Session.findByIdAndDelete(sessionId);
        }
        catch (err) {
            logger_service_1.logger.error(`SessionService.remove failed for ${sessionId}`, err);
            throw err;
        }
    }
    static async handleSetsCreation(exercises, sessionId, userId) {
        const setsToSave = [];
        exercises.forEach((exercise) => {
            exercise.sets.forEach((set, index) => {
                const setData = {
                    sessionId,
                    userId,
                    exerciseId: exercise.exerciseId,
                    setNumber: index + 1,
                    weight: set.weight,
                    reps: set.reps,
                    isDone: set.isDone,
                };
                // Only include RPE or RIR if they have actual values, but not both
                if (set.rir?.actual != null) {
                    setData.rir = {
                        expected: set.rir?.expected,
                        actual: set.rir?.actual,
                    };
                }
                else if (set.rpe?.actual != null) {
                    setData.rpe = {
                        expected: set.rpe?.expected,
                        actual: set.rpe?.actual,
                    };
                }
                setsToSave.push(setData);
            });
        });
        try {
            await set_service_1.SetService.addSets(setsToSave);
        }
        catch (err) {
            logger_service_1.logger.error(`SessionService.handleSetsCreation failed for ${sessionId}`, err);
            throw err;
        }
    }
}
exports.SessionService = SessionService;
