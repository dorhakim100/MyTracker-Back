"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstructionsService = void 0;
const instructions_model_1 = require("./instructions.model");
const logger_service_1 = require("../../services/logger.service");
const session_service_1 = require("../session/session.service");
class InstructionsService {
    static getEmptyInstructions(workoutId) {
        return {
            workoutId,
            exercises: [],
            isDone: false,
            doneTimes: 0,
            isFinished: false,
            isEmpty: true,
            weekNumber: 1,
        };
    }
    /**
     * Ensures RPE and RIR are mutually exclusive in instruction sets.
     * If RIR has a value, RPE should be undefined.
     * If RPE has a value, RIR should be undefined.
     */
    static sanitizeInstructionSets(instruction) {
        if (!instruction.exercises) {
            return instruction;
        }
        const sanitized = { ...instruction };
        sanitized.exercises = instruction.exercises.map((exercise) => {
            if (!exercise.sets) {
                return exercise;
            }
            return {
                ...exercise,
                sets: exercise.sets.map((set) => {
                    const setData = { ...set };
                    // Check if RIR has a value (expected or actual)
                    const hasRir = set.rir?.expected != null || set.rir?.actual != null;
                    // Check if RPE has a value (expected or actual)
                    const hasRpe = set.rpe?.expected != null || set.rpe?.actual != null;
                    if (hasRir) {
                        // If RIR exists, remove RPE
                        delete setData.rpe;
                    }
                    else if (hasRpe) {
                        // If RPE exists, remove RIR
                        delete setData.rir;
                    }
                    else {
                        // If neither has a value, remove both
                        delete setData.rpe;
                        delete setData.rir;
                    }
                    return setData;
                }),
            };
        });
        return sanitized;
    }
    static async query(filterBy = {}) {
        try {
            const instructions = await instructions_model_1.Instructions.find(filterBy);
            return instructions;
        }
        catch (err) {
            logger_service_1.logger.error('Failed to query instructions', err);
            throw err;
        }
    }
    static async getByWorkoutId(filter) {
        try {
            let instructions;
            instructions = await instructions_model_1.Instructions.findOne({ ...filter });
            if (!instructions) {
                instructions = await instructions_model_1.Instructions.findOne({
                    workoutId: filter.workoutId,
                }).sort({ weekNumber: -1 });
                if (!instructions) {
                    return await instructions_model_1.Instructions.create({ ...filter, exercises: [] });
                }
                else {
                    // Convert Mongoose document to plain object and exclude _id
                    const instructionsObj = instructions.toObject();
                    const { _id, ...instructionsWithoutId } = instructionsObj;
                    const newInstruction = {
                        ...instructionsWithoutId,
                        weekNumber: filter.weekNumber,
                        timesPerWeek: instructionsObj.timesPerWeek,
                        doneTimes: 0,
                        isDone: false,
                    };
                    const sanitizedInstruction = this.sanitizeInstructionSets(newInstruction);
                    return await instructions_model_1.Instructions.create(sanitizedInstruction);
                }
            }
            return instructions;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to get instructions by workout id ${filter.workoutId}`, err);
            throw err;
        }
    }
    static async getNextInstructionsByWorkoutIdAndUpdate(filter) {
        try {
            const instruction = await instructions_model_1.Instructions.findOne({
                ...filter,
                isDone: false,
            });
            if (!instruction) {
                return null;
            }
            const newDoneTimes = instruction.doneTimes + 1;
            const isDoneToSet = newDoneTimes >= instruction.timesPerWeek ? true : false;
            const newExercises = instruction.exercises.map((exercise) => {
                return {
                    ...exercise,
                    sets: exercise.sets.map((set) => {
                        const setData = {
                            ...set,
                            weight: {
                                expected: set.weight.expected,
                                actual: set.weight.expected,
                            },
                            reps: {
                                expected: set.reps.expected,
                                actual: set.reps.expected,
                            },
                            isDone: false,
                        };
                        // Only include RPE or RIR if they have expected values, but not both
                        if (set.rir?.expected != null) {
                            setData.rir = {
                                expected: set.rir.expected,
                                actual: set.rir.expected,
                            };
                        }
                        else if (set.rpe?.expected != null) {
                            setData.rpe = {
                                expected: set.rpe.expected,
                                actual: set.rpe.expected,
                            };
                        }
                        return setData;
                    }),
                };
            });
            const updatedInstruction = await instructions_model_1.Instructions.findByIdAndUpdate(instruction._id, {
                doneTimes: newDoneTimes,
                isDone: isDoneToSet,
                exercises: newExercises,
                isFinished: false,
            }, { new: true });
            return updatedInstruction;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to get instructions by workout id ${filter.workoutId}`, err);
            throw err;
        }
    }
    static async getNextInstructionsByWorkoutId(filter) {
        try {
            const instruction = await instructions_model_1.Instructions.findOne({
                ...filter,
                isDone: false,
            });
            if (!instruction) {
                return null;
            }
            return instruction;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to get instructions by workout id ${filter.workoutId}`, err);
            throw err;
        }
    }
    static async getById(instructionId) {
        try {
            const instruction = await instructions_model_1.Instructions.findById(instructionId);
            return instruction;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to get instruction ${instructionId}`, err);
            throw err;
        }
    }
    static async add(instruction) {
        try {
            const sanitizedInstruction = this.sanitizeInstructionSets(instruction);
            const addedInstruction = await instructions_model_1.Instructions.create(sanitizedInstruction);
            return addedInstruction;
        }
        catch (err) {
            logger_service_1.logger.error('Failed to add instruction', err);
            throw err;
        }
    }
    static async update(instructionId, instructionToUpdate) {
        try {
            const sanitizedInstruction = this.sanitizeInstructionSets(instructionToUpdate);
            // Build update object with $unset for fields that need to be removed from nested sets
            const update = { ...sanitizedInstruction };
            const isFinished = instructionToUpdate?.exercises?.every((exercise) => exercise.sets.every((set) => set.isDone));
            // For nested arrays, we need to ensure the update properly removes RPE/RIR
            // MongoDB will handle this when we update the entire exercises array
            let instruction = await instructions_model_1.Instructions.findByIdAndUpdate(instructionId, { ...update, isFinished }, {
                new: true,
            });
            return instruction;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to update instruction ${instructionId}`, err);
            throw err;
        }
    }
    static async remove(instructionId) {
        try {
            await instructions_model_1.Instructions.findByIdAndDelete(instructionId);
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to remove instruction ${instructionId}`, err);
            throw err;
        }
    }
    static async getWeekNumberDone(workoutId) {
        try {
            const allInstructions = await instructions_model_1.Instructions.find({ workoutId });
            const weekNumberDone = allInstructions.map((instruction) => {
                return {
                    weekNumber: instruction.weekNumber,
                    isDone: instruction.isDone,
                };
            });
            return weekNumberDone;
            // return weekNumberDone
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to get week number done ${workoutId}`, err);
            throw err;
        }
    }
    static async undoPlayWorkout(instructionsId) {
        try {
            const instructions = await instructions_model_1.Instructions.findById(instructionsId);
            if (!instructions) {
                return null;
            }
            const updatedInstructions = await instructions_model_1.Instructions.findByIdAndUpdate(instructionsId, {
                isDone: false,
                doneTimes: instructions.doneTimes - 1,
            }, { new: true });
            return updatedInstructions;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to undo play workout ${instructionsId}`, err);
            throw err;
        }
    }
    static async getNotesBySessionIdAndExerciseId(sessionId, exerciseId) {
        try {
            const session = await session_service_1.SessionService.getById(sessionId);
            if (!session || !session.instructionsId) {
                logger_service_1.logger.error(`Session not found ${sessionId}`);
                return null;
            }
            const instruction = await this.getById(session.instructionsId);
            if (!instruction) {
                logger_service_1.logger.error(`Instruction not found ${sessionId}`);
                return null;
            }
            const notes = instruction.exercises.find((exercise) => exercise.exerciseId === exerciseId)?.notes;
            return notes;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to get actual notes ${sessionId} ${exerciseId}`, err);
            throw err;
        }
    }
}
exports.InstructionsService = InstructionsService;
