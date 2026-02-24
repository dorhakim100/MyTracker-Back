"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExerciseController = void 0;
const exercise_service_1 = require("./exercise.service");
const logger_service_1 = require("../../services/logger.service");
class ExerciseController {
    /**
     * Get exercise by ID
     */
    static async getExercise(req, res) {
        try {
            const exercise = await exercise_service_1.ExerciseService.getById(req.params.id);
            if (!exercise) {
                return res.status(404).send({ err: 'Exercise not found' });
            }
            res.json(exercise);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get exercise', err);
            res.status(500).send({ err: 'Failed to get exercise' });
        }
    }
    /**
     * Get exercise by exerciseId (from ExerciseDB)
     */
    static async getExerciseByExerciseId(req, res) {
        try {
            const { exerciseId } = req.query;
            if (!exerciseId || typeof exerciseId !== 'string') {
                return res.status(400).send({ err: 'ExerciseId is required' });
            }
            const exercise = await exercise_service_1.ExerciseService.getByExerciseId(exerciseId);
            if (!exercise) {
                return res.status(404).send({ err: 'Exercise not found' });
            }
            res.json(exercise);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get exercise by exerciseId', err);
            res.status(500).send({ err: 'Failed to get exercise by exerciseId' });
        }
    }
    /**
     * Get exercises by exerciseIds (bulk)
     */
    static async getExercisesByExerciseIds(req, res) {
        try {
            const { exerciseIds } = req.query;
            if (!exerciseIds || !Array.isArray(exerciseIds)) {
                return res.status(400).send({ err: 'ExerciseIds array is required' });
            }
            const exercises = await exercise_service_1.ExerciseService.getByExerciseIds(exerciseIds);
            res.json(exercises);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get exercises by exerciseIds', err);
            res.status(500).send({ err: 'Failed to get exercises by exerciseIds' });
        }
    }
    /**
     * Query exercises with filters
     */
    static async getExercises(req, res) {
        try {
            const exercises = await exercise_service_1.ExerciseService.query(req.query);
            res.json(exercises);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get exercises', err);
            res.status(500).send({ err: 'Failed to get exercises' });
        }
    }
    /**
     * Get alternate exercises
     */
    static async getAlternateExercises(req, res) {
        try {
            const { exerciseToChange } = req.query;
            if (!exerciseToChange) {
                return res.status(400).send({ err: 'Exercise is required' });
            }
            const exercises = await exercise_service_1.ExerciseService.getAlternateExercises(exerciseToChange);
            res.json(exercises);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get alternate exercises', err);
            res.status(500).send({ err: 'Failed to get alternate exercises' });
        }
    }
    /**
     * Search exercises by name
     */
    static async searchExercises(req, res) {
        try {
            const { q, muscleGroup, equipment } = req.query;
            if (!q || typeof q !== 'string') {
                return res.status(400).send({ err: 'Query parameter is required' });
            }
            const exercises = await exercise_service_1.ExerciseService.searchByName({
                query: q,
                muscleGroup,
                equipment,
            });
            res.json(exercises);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to search exercises', err);
            res.status(500).send({ err: 'Failed to search exercises' });
        }
    }
    /**
     * Search exercises by muscle groups
     */
    static async searchExercisesByMuscleGroups(req, res) {
        try {
            const { muscleGroups } = req.query;
            if (!muscleGroups) {
                return res.status(400).send({ err: 'Muscle groups are required' });
            }
            const muscleGroupsArray = Array.isArray(muscleGroups)
                ? muscleGroups
                : [muscleGroups];
            const exercises = await exercise_service_1.ExerciseService.searchByMuscleGroups(muscleGroupsArray);
            res.json(exercises);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to search exercises by muscle groups', err);
            res.status(500).send({
                err: 'Failed to search exercises by muscle groups',
            });
        }
    }
    /**
     * Search exercises by equipment
     */
    static async searchExercisesByEquipment(req, res) {
        try {
            const { equipment } = req.query;
            if (!equipment) {
                return res.status(400).send({ err: 'Equipment is required' });
            }
            const equipmentArray = Array.isArray(equipment)
                ? equipment
                : [equipment];
            const exercises = await exercise_service_1.ExerciseService.searchByEquipment(equipmentArray);
            res.json(exercises);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to search exercises by equipment', err);
            res.status(500).send({ err: 'Failed to search exercises by equipment' });
        }
    }
    /**
     * Add a single exercise
     */
    static async addExercise(req, res) {
        try {
            const exercise = req.body;
            delete exercise._id;
            const addedExercise = await exercise_service_1.ExerciseService.add(exercise);
            res.json(addedExercise);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to add exercise', err);
            if (err.message?.includes('already exists')) {
                return res.status(409).send({ err: err.message });
            }
            res.status(500).send({ err: 'Failed to add exercise' });
        }
    }
    /**
     * Add multiple exercises (bulk)
     */
    static async addExercises(req, res) {
        try {
            const { exercises } = req.body;
            if (!exercises || !Array.isArray(exercises)) {
                return res.status(400).send({ err: 'Exercises array is required' });
            }
            const addedExercises = await exercise_service_1.ExerciseService.addMany(exercises);
            res.json(addedExercises);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to add exercises', err);
            res.status(500).send({ err: 'Failed to add exercises' });
        }
    }
    /**
     * Update an exercise
     */
    static async updateExercise(req, res) {
        try {
            const exercise = await exercise_service_1.ExerciseService.update(req.params.id, req.body);
            if (!exercise) {
                return res.status(404).send({ err: 'Exercise not found' });
            }
            res.json(exercise);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to update exercise', err);
            res.status(500).send({ err: 'Failed to update exercise' });
        }
    }
    /**
     * Update an exercise by exerciseId
     */
    static async updateExerciseByExerciseId(req, res) {
        try {
            const { exerciseId } = req.query;
            if (!exerciseId || typeof exerciseId !== 'string') {
                return res.status(400).send({ err: 'ExerciseId is required' });
            }
            const exercise = await exercise_service_1.ExerciseService.updateByExerciseId(exerciseId, req.body);
            if (!exercise) {
                return res.status(404).send({ err: 'Exercise not found' });
            }
            res.json(exercise);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to update exercise by exerciseId', err);
            res.status(500).send({ err: 'Failed to update exercise by exerciseId' });
        }
    }
    /**
     * Delete an exercise
     */
    static async deleteExercise(req, res) {
        try {
            await exercise_service_1.ExerciseService.remove(req.params.id);
            res.send({ msg: 'Deleted successfully' });
        }
        catch (err) {
            logger_service_1.logger.error('Failed to delete exercise', err);
            res.status(500).send({ err: 'Failed to delete exercise' });
        }
    }
    /**
     * Delete an exercise by exerciseId
     */
    static async deleteExerciseByExerciseId(req, res) {
        try {
            const { exerciseId } = req.query;
            if (!exerciseId || typeof exerciseId !== 'string') {
                return res.status(400).send({ err: 'ExerciseId is required' });
            }
            await exercise_service_1.ExerciseService.removeByExerciseId(exerciseId);
            res.send({ msg: 'Deleted successfully' });
        }
        catch (err) {
            logger_service_1.logger.error('Failed to delete exercise by exerciseId', err);
            res.status(500).send({ err: 'Failed to delete exercise by exerciseId' });
        }
    }
}
exports.ExerciseController = ExerciseController;
