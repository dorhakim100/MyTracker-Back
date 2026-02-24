"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetService = void 0;
const set_model_1 = require("./set.model");
const logger_service_1 = require("../../services/logger.service");
class SetService {
    /**
     * Ensures RPE and RIR are mutually exclusive.
     * If RIR has an actual value, RPE should be undefined.
     * If RPE has an actual value, RIR should be undefined.
     */
    static sanitizeRpeRir(set) {
        const sanitized = { ...set };
        // Check if RIR has an actual value (not null/undefined)
        const hasRir = sanitized.rir?.actual != null;
        // Check if RPE has an actual value (not null/undefined)
        const hasRpe = sanitized.rpe?.actual != null;
        if (hasRir) {
            // If RIR exists, remove RPE (set to undefined so it's not included)
            sanitized.rpe = undefined;
        }
        else if (hasRpe) {
            // If RPE exists, remove RIR (set to undefined so it's not included)
            sanitized.rir = undefined;
        }
        else {
            // If neither has actual value, remove both
            sanitized.rpe = undefined;
            sanitized.rir = undefined;
        }
        // Remove undefined fields to ensure they're not saved
        Object.keys(sanitized).forEach((key) => {
            if (sanitized[key] === undefined) {
                delete sanitized[key];
            }
        });
        return sanitized;
    }
    static async query(filterBy = {}) {
        try {
            const sets = await set_model_1.Set.find({ ...filterBy, isDone: true }).sort({
                setNumber: 1,
            });
            return sets;
        }
        catch (err) {
            logger_service_1.logger.error('Failed to query sets', err);
            throw err;
        }
    }
    static async getById(setId) {
        try {
            const set = await set_model_1.Set.findById(setId);
            return set;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to get set ${setId}`, err);
            throw err;
        }
    }
    static async getBySessionId(sessionId) {
        try {
            const sets = await set_model_1.Set.find({ sessionId }).sort({
                exerciseId: 1,
                setNumber: 1,
            });
            return sets;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to get sets by session id ${sessionId}`, err);
            throw err;
        }
    }
    static async getBySessionIdAndExerciseId(sessionId, exerciseId) {
        try {
            const sets = await set_model_1.Set.find({ sessionId, exerciseId }).sort({
                setNumber: 1,
            });
            return sets;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to get sets by session id ${sessionId} and exercise id ${exerciseId}`, err);
            throw err;
        }
    }
    static async add(set) {
        try {
            const sanitizedSet = this.sanitizeRpeRir(set);
            const addedSet = await set_model_1.Set.create(sanitizedSet);
            return addedSet;
        }
        catch (err) {
            logger_service_1.logger.error('Failed to add set', err);
            throw err;
        }
    }
    static async bulkSave(sets) {
        try {
            const sanitizedSets = sets.map((set) => this.sanitizeRpeRir(set));
            console.log('sanitizedSets', sanitizedSets);
            const savedSets = await set_model_1.Set.insertMany(sanitizedSets);
            return savedSets;
        }
        catch (err) {
            logger_service_1.logger.error('Failed to bulk save sets', err);
            throw err;
        }
    }
    static async update(setId, setToUpdate) {
        try {
            const sanitizedSet = this.sanitizeRpeRir(setToUpdate);
            // Build update object with $unset for fields that need to be removed
            const update = { ...sanitizedSet };
            const unset = {};
            // If RPE/RIR were in the update but removed by sanitization, unset them
            if (!('rpe' in sanitizedSet) &&
                ('rpe' in setToUpdate || 'rir' in setToUpdate)) {
                unset.rpe = '';
            }
            if (!('rir' in sanitizedSet) &&
                ('rpe' in setToUpdate || 'rir' in setToUpdate)) {
                unset.rir = '';
            }
            if (Object.keys(unset).length > 0) {
                update.$unset = unset;
            }
            const set = await set_model_1.Set.findByIdAndUpdate(setId, update, {
                new: true,
            });
            return set;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to update set ${setId}`, err);
            throw err;
        }
    }
    static async remove(setId) {
        try {
            await set_model_1.Set.findByIdAndDelete(setId);
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to remove set ${setId}`, err);
            throw err;
        }
    }
    static async removeBySessionId(sessionId) {
        try {
            await set_model_1.Set.deleteMany({ sessionId });
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to remove sets by session id ${sessionId}`, err);
            throw err;
        }
    }
    static async removeBySessionIdAndExerciseId(sessionId, exerciseId) {
        try {
            await set_model_1.Set.deleteMany({ sessionId, exerciseId });
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to remove sets by session id ${sessionId} and exercise id ${exerciseId}`, err);
            throw err;
        }
    }
    static async addSets(sets) {
        try {
            const sanitizedSets = sets.map((set) => this.sanitizeRpeRir(set));
            await set_model_1.Set.insertMany(sanitizedSets);
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to add sets`, err);
            throw err;
        }
    }
    static async saveBySessionIdAndExerciseIdAndSetIndex(sessionId, exerciseId, setIndex, set) {
        try {
            const sanitizedSet = this.sanitizeRpeRir(set);
            // Build update object with $unset for fields that need to be removed
            const update = { ...sanitizedSet };
            const unset = {};
            // If RPE/RIR were in the update but removed by sanitization, unset them
            if (!('rpe' in sanitizedSet) && ('rpe' in set || 'rir' in set)) {
                unset.rpe = '';
            }
            if (!('rir' in sanitizedSet) && ('rpe' in set || 'rir' in set)) {
                unset.rir = '';
            }
            if (Object.keys(unset).length > 0) {
                update.$unset = unset;
            }
            const savedSet = await set_model_1.Set.findOneAndUpdate({ sessionId, exerciseId, setNumber: setIndex + 1 }, update, { new: true });
            return savedSet;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to save set by session id and exercise id and set index`, err);
            throw err;
        }
    }
    static async addBySessionIdAndExerciseIdAndSetIndex(sessionId, exerciseId, setIndex, set) {
        try {
            const sanitizedSet = this.sanitizeRpeRir(set);
            const addedSet = await set_model_1.Set.create({
                ...sanitizedSet,
                sessionId,
                exerciseId,
                setNumber: setIndex + 1,
            });
            return addedSet;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to add set by session id and exercise id and set index`, err);
            throw err;
        }
    }
    static async removeBySessionIdAndExerciseIdAndSetIndex(sessionId, exerciseId, setIndex) {
        try {
            await set_model_1.Set.deleteOne({ sessionId, exerciseId, setNumber: setIndex + 1 });
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to remove set by session id and exercise id and set index`, err);
            throw err;
        }
    }
}
exports.SetService = SetService;
