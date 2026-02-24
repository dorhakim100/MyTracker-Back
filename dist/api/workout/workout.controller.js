"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkoutController = void 0;
const workout_service_1 = require("./workout.service");
const logger_service_1 = require("../../services/logger.service");
class WorkoutController {
    static async getWorkouts(req, res) {
        try {
            const filter = {
                from: req.query.from ||
                    new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
                to: req.query.to || new Date().toISOString(),
                forUserId: req.query.forUserId || '',
            };
            const workouts = await workout_service_1.WorkoutService.query(filter);
            res.json(workouts);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get workouts', err);
            res.status(500).send({ err: 'Failed to get workouts' });
        }
    }
    static async getWorkout(req, res) {
        try {
            const workout = await workout_service_1.WorkoutService.getById(req.params.id);
            res.json(workout);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get workout', err);
            res.status(500).send({ err: 'Failed to get workout' });
        }
    }
    static async addWorkout(req, res) {
        try {
            const workout = req.body;
            // workout.createdBy = req.user?._id as string
            const addedWorkout = await workout_service_1.WorkoutService.add(workout);
            res.json(addedWorkout);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to add workout', err);
            res.status(500).send({ err: 'Failed to add workout' });
        }
    }
    static async updateWorkout(req, res) {
        try {
            const workout = await workout_service_1.WorkoutService.update(req.params.id, req.body);
            res.json(workout);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to update workout', err);
            res.status(500).send({ err: 'Failed to update workout' });
        }
    }
    static async deleteWorkout(req, res) {
        try {
            await workout_service_1.WorkoutService.remove(req.params.id);
            res.send({ msg: 'Deleted successfully' });
        }
        catch (err) {
            logger_service_1.logger.error('Failed to delete workout', err);
            res.status(500).send({ err: 'Failed to delete workout' });
        }
    }
}
exports.WorkoutController = WorkoutController;
