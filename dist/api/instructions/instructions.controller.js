"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstructionsController = void 0;
const instructions_service_1 = require("./instructions.service");
const logger_service_1 = require("../../services/logger.service");
class InstructionsController {
    static async getInstructions(req, res) {
        try {
            const instructions = await instructions_service_1.InstructionsService.query(req.query);
            res.json(instructions);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get instructions', err);
            res.status(500).send({ err: 'Failed to get instructions' });
        }
    }
    static async getInstructionsByWorkoutId(req, res) {
        try {
            const filter = {
                workoutId: req.params.workoutId || '',
                weekNumber: Number(req.query.weekNumber) || 1,
                // forUserId: (req.query.forUserId as string) || '',
            };
            const instructions = await instructions_service_1.InstructionsService.getByWorkoutId(filter);
            res.json(instructions);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get instructions by workout id', err);
            res.status(500).send({ err: 'Failed to get instructions by workout id' });
        }
    }
    static async getInstruction(req, res) {
        try {
            const instruction = await instructions_service_1.InstructionsService.getById(req.params.id);
            if (!instruction) {
                return res.status(404).send({ err: 'Instruction not found' });
            }
            res.json(instruction);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get instruction', err);
            res.status(500).send({ err: 'Failed to get instruction' });
        }
    }
    static async addInstruction(req, res) {
        try {
            const instructions = req.body;
            delete instructions._id;
            const addedInstructions = await instructions_service_1.InstructionsService.add(instructions);
            res.json(addedInstructions);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to add instructions', err);
            res.status(500).send({ err: 'Failed to add instructions' });
        }
    }
    static async updateInstruction(req, res) {
        try {
            const instruction = req.body;
            const updatedInstruction = await instructions_service_1.InstructionsService.update(req.params.id, instruction);
            res.json(updatedInstruction);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to update instruction', err);
            res.status(500).send({ err: 'Failed to update instruction' });
        }
    }
    static async deleteInstruction(req, res) {
        try {
            const instruction = await instructions_service_1.InstructionsService.remove(req.params.id);
            res.send({ msg: 'Deleted successfully' });
        }
        catch (err) {
            logger_service_1.logger.error('Failed to delete instruction', err);
            res.status(500).send({ err: 'Failed to delete instruction' });
        }
    }
    static async getWeekNumberDone(req, res) {
        try {
            const workoutId = req.query.workoutId;
            const weekNumberDone = await instructions_service_1.InstructionsService.getWeekNumberDone(workoutId);
            res.send(weekNumberDone);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get week number done', err);
            res.status(500).send({ err: 'Failed to get week number done' });
        }
    }
    static async getNotesBySessionIdAndExerciseId(req, res) {
        try {
            const { sessionId, exerciseId } = req.query;
            const notes = await instructions_service_1.InstructionsService.getNotesBySessionIdAndExerciseId(sessionId, exerciseId);
            res.send(notes);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get actual notes', err);
            res.status(500).send({ err: 'Failed to get actual notes' });
        }
    }
}
exports.InstructionsController = InstructionsController;
