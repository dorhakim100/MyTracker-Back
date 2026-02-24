"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalService = void 0;
const goal_model_1 = require("./goal.model");
const logger_service_1 = require("../../services/logger.service");
class GoalService {
    static async listByUser(userId) {
        try {
            const goals = await goal_model_1.GoalModel.find({ userId }).sort({ startDate: -1 });
            return goals;
        }
        catch (err) {
            logger_service_1.logger.error(`GoalService.listByUser failed for ${userId}`, err);
            throw err;
        }
    }
    static async getById(id) {
        try {
            const goal = await goal_model_1.GoalModel.findById(id);
            return goal;
        }
        catch (err) {
            logger_service_1.logger.error(`GoalService.getById failed for ${id}`, err);
            throw err;
        }
    }
    static async add(goal) {
        try {
            const goalToSave = {
                isSelected: true,
                title: goal.title,
                dailyCalories: goal.dailyCalories,
                macros: goal.macros,
                startDate: goal.startDate,
                endDate: goal.endDate,
                target: goal.target,
                targetWeight: goal.targetWeight,
                updatedAt: Date.now(),
                userId: goal.userId,
            };
            await this.setAllGoalsAsNotSelected(goal.userId);
            const created = await goal_model_1.GoalModel.create(goalToSave);
            return created;
        }
        catch (err) {
            logger_service_1.logger.error('GoalService.add failed', err);
            throw err;
        }
    }
    static async update(id, goalToUpdate) {
        try {
            goalToUpdate.updatedAt = Date.now();
            const updated = await goal_model_1.GoalModel.findByIdAndUpdate(id, goalToUpdate, {
                new: true,
            });
            return updated;
        }
        catch (err) {
            logger_service_1.logger.error(`GoalService.update failed for ${id}`, err);
            throw err;
        }
    }
    static async remove(id) {
        try {
            await goal_model_1.GoalModel.findByIdAndDelete(id);
        }
        catch (err) {
            logger_service_1.logger.error(`GoalService.remove failed for ${id}`, err);
            throw err;
        }
    }
    static async select(userId, goalId) {
        try {
            // Unselect all
            await goal_model_1.GoalModel.updateMany({ userId }, { $set: { isSelected: false } });
            // Select given
            const updated = await goal_model_1.GoalModel.findByIdAndUpdate(goalId, {
                isSelected: true,
                updatedAt: Date.now(),
            });
            return updated;
        }
        catch (err) {
            logger_service_1.logger.error(`GoalService.select failed for ${goalId}`, err);
            throw err;
        }
    }
    static async setAllGoalsAsNotSelected(userId) {
        try {
            await goal_model_1.GoalModel.updateMany({ userId }, { $set: { isSelected: false } });
        }
        catch (err) {
            logger_service_1.logger.error(`GoalService.setAllGoalsAsNotSelected failed for ${userId}`, err);
            throw err;
        }
    }
    static async removeAllByUserId(userId) {
        try {
            await goal_model_1.GoalModel.deleteMany({ userId });
        }
        catch (err) {
            logger_service_1.logger.error(`GoalService.removeAllByUserId failed for ${userId}`, err);
            throw err;
        }
    }
}
exports.GoalService = GoalService;
