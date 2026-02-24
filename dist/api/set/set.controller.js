"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetController = void 0;
const set_service_1 = require("./set.service");
const logger_service_1 = require("../../services/logger.service");
class SetController {
    static async getSets(req, res) {
        try {
            const sets = await set_service_1.SetService.query(req.query);
            res.json(sets);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get sets', err);
            res.status(500).send({ err: 'Failed to get sets' });
        }
    }
    static async getSet(req, res) {
        try {
            const set = await set_service_1.SetService.getById(req.params.id);
            if (!set) {
                return res.status(404).send({ err: 'Set not found' });
            }
            res.json(set);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get set', err);
            res.status(500).send({ err: 'Failed to get set' });
        }
    }
    static async getSetsBySessionId(req, res) {
        try {
            const sessionId = req.params.sessionId;
            const sets = await set_service_1.SetService.getBySessionId(sessionId);
            res.json(sets);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get sets by session id', err);
            res.status(500).send({ err: 'Failed to get sets by session id' });
        }
    }
    static async getSetsBySessionIdAndExerciseId(req, res) {
        try {
            const { sessionId, exerciseId } = req.params;
            const sets = await set_service_1.SetService.getBySessionIdAndExerciseId(sessionId, exerciseId);
            res.json(sets);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get sets by session id and exercise id', err);
            res
                .status(500)
                .send({ err: 'Failed to get sets by session id and exercise id' });
        }
    }
    static async addSet(req, res) {
        try {
            const set = req.body;
            delete set._id;
            const addedSet = await set_service_1.SetService.add(set);
            res.json(addedSet);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to add set', err);
            res.status(500).send({ err: 'Failed to add set' });
        }
    }
    static async bulkSaveSets(req, res) {
        try {
            const sets = req.body;
            const savedSets = await set_service_1.SetService.bulkSave(sets);
            res.json(savedSets);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to bulk save sets', err);
            res.status(500).send({ err: 'Failed to bulk save sets' });
        }
    }
    static async updateSet(req, res) {
        try {
            const set = req.body;
            const updatedSet = await set_service_1.SetService.update(req.params.id, set);
            if (!updatedSet) {
                return res.status(404).send({ err: 'Set not found' });
            }
            res.json(updatedSet);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to update set', err);
            res.status(500).send({ err: 'Failed to update set' });
        }
    }
    static async deleteSet(req, res) {
        try {
            await set_service_1.SetService.remove(req.params.id);
            res.send({ msg: 'Deleted successfully' });
        }
        catch (err) {
            logger_service_1.logger.error('Failed to delete set', err);
            res.status(500).send({ err: 'Failed to delete set' });
        }
    }
    static async deleteSetsBySessionId(req, res) {
        try {
            const sessionId = req.params.sessionId;
            await set_service_1.SetService.removeBySessionId(sessionId);
            res.send({ msg: 'Deleted successfully' });
        }
        catch (err) {
            logger_service_1.logger.error('Failed to delete sets by session id', err);
            res.status(500).send({ err: 'Failed to delete sets by session id' });
        }
    }
    static async deleteSetsBySessionIdAndExerciseId(req, res) {
        try {
            const { sessionId, exerciseId } = req.params;
            await set_service_1.SetService.removeBySessionIdAndExerciseId(sessionId, exerciseId);
            res.send({ msg: 'Deleted successfully' });
        }
        catch (err) {
            logger_service_1.logger.error('Failed to delete sets by session id and exercise id', err);
            res
                .status(500)
                .send({ err: 'Failed to delete sets by session id and exercise id' });
        }
    }
    static async saveSetBySessionIdAndExerciseIdAndSetIndex(req, res) {
        try {
            const { sessionId, exerciseId, setIndex } = req.params;
            const set = req.body;
            const savedSet = await set_service_1.SetService.saveBySessionIdAndExerciseIdAndSetIndex(sessionId, exerciseId, Number(setIndex), set);
            res.json(savedSet);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to save set by session id and exercise id and set index', err);
            res.status(500).send({
                err: 'Failed to save set by session id and exercise id and set index',
            });
        }
    }
    static async addSetBySessionIdAndExerciseIdAndSetIndex(req, res) {
        try {
            const { sessionId, exerciseId, setIndex } = req.params;
            const set = req.body;
            const addedSet = await set_service_1.SetService.addBySessionIdAndExerciseIdAndSetIndex(sessionId, exerciseId, Number(setIndex), set);
            res.json(addedSet);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to add set by session id and exercise id and set index', err);
            res.status(500).send({
                err: 'Failed to add set by session id and exercise id and set index',
            });
        }
    }
    static async deleteSetBySessionIdAndExerciseIdAndSetIndex(req, res) {
        try {
            const { sessionId, exerciseId, setIndex } = req.params;
            await set_service_1.SetService.removeBySessionIdAndExerciseIdAndSetIndex(sessionId, exerciseId, Number(setIndex));
            res.send({ msg: 'Deleted successfully' });
        }
        catch (err) {
            logger_service_1.logger.error('Failed to delete set by session id and exercise id and set index', err);
            res.status(500).send({
                err: 'Failed to delete set by session id and exercise id and set index',
            });
        }
    }
}
exports.SetController = SetController;
