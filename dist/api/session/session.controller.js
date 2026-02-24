"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionController = void 0;
const session_service_1 = require("./session.service");
const logger_service_1 = require("../../services/logger.service");
class SessionController {
    static async get(req, res) {
        const { date, userId } = req.query;
        let sessionToSend = null;
        try {
            if (!userId || !date) {
                return res.status(400).send({ err: 'userId and date are required' });
            }
            const session = await session_service_1.SessionService.getByUserAndDate(userId, date);
            if (!session) {
                sessionToSend = await session_service_1.SessionService.add({ userId, date });
            }
            else {
                sessionToSend = session;
            }
            res.json(sessionToSend);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get sessions', err);
            res.status(500).send({ err: 'Failed to get sessions' });
        }
    }
    static async getById(req, res) {
        try {
            const session = await session_service_1.SessionService.getById(req.params.id);
            if (!session)
                return res.status(404).send({ err: 'Session not found' });
            res.json(session);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get session', err);
            res.status(500).send({ err: 'Failed to get session' });
        }
    }
    static async getByDate(req, res) {
        try {
            const { userId } = req.params;
            const { date } = req.query;
            const sessions = await session_service_1.SessionService.getByUserAndDate(userId, date);
            res.json(sessions);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get sessions by date', err);
            res.status(500).send({ err: 'Failed to get sessions by date' });
        }
    }
    static async listByUser(req, res) {
        try {
            const { userId } = req.params;
            const limit = parseInt(String(req.query.limit || '30'), 10);
            const filterBy = { ...req.query };
            delete filterBy.limit;
            const sessions = await session_service_1.SessionService.listByUser(userId, limit, filterBy);
            res.json(sessions);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to list sessions by user', err);
            res.status(500).send({ err: 'Failed to list sessions by user' });
        }
    }
    static async add(req, res) {
        try {
            const session = req.body;
            const addedSession = await session_service_1.SessionService.add(session);
            res.json(addedSession);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to add session', err);
            res.status(500).send({ err: 'Failed to add session' });
        }
    }
    static async update(req, res) {
        try {
            const session = await session_service_1.SessionService.update(req.params.id, req.body);
            if (!session)
                return res.status(404).send({ err: 'Session not found' });
            res.json(session);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to update session', err);
            res.status(500).send({ err: 'Failed to update session' });
        }
    }
    static async delete(req, res) {
        try {
            await session_service_1.SessionService.remove(req.params.id);
            res.send({ msg: 'Deleted successfully' });
        }
        catch (err) {
            logger_service_1.logger.error('Failed to delete session', err);
            res.status(500).send({ err: 'Failed to delete session' });
        }
    }
    static async playWorkout(req, res) {
        try {
            const { workoutId, userId } = req.body;
            const session = await session_service_1.SessionService.playWorkout(req.params.id, workoutId, userId);
            res.json(session);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to play workout', err);
            res.status(500).send({ err: 'Failed to play workout' });
        }
    }
    static async playEmptyWorkout(req, res) {
        try {
            const { userId } = req.body;
            const session = await session_service_1.SessionService.playEmptyWorkout(userId);
            res.json(session);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to play empty workout', err);
            res.status(500).send({ err: 'Failed to play empty workout' });
        }
    }
}
exports.SessionController = SessionController;
