"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MealService = void 0;
const meal_model_1 = require("./meal.model");
const logger_service_1 = require("../../services/logger.service");
class MealService {
    static async query(filterBy = {}) {
        try {
            const meals = await meal_model_1.Meal.find(filterBy).populate('createdBy', 'name email');
            return meals;
        }
        catch (err) {
            logger_service_1.logger.error('Failed to query meals', err);
            throw err;
        }
    }
    static async getByMealIds(mealIds) {
        try {
            const meals = await meal_model_1.Meal.find({ _id: { $in: mealIds } });
            return meals;
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get meals by meal ids', err);
            throw err;
        }
    }
    static async getById(logId) {
        try {
            const meal = await meal_model_1.Meal.findById(logId).populate('createdBy', 'name email');
            return meal;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to get log ${logId}`, err);
            throw err;
        }
    }
    static async add(log) {
        try {
            const addedLog = await meal_model_1.Meal.create(log);
            return addedLog;
        }
        catch (err) {
            logger_service_1.logger.error('Failed to add meal', err);
            throw err;
        }
    }
    static async update(logId, logToUpdate) {
        try {
            const log = await meal_model_1.Meal.findByIdAndUpdate(logId, logToUpdate, {
                new: true,
            });
            return log;
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to update log ${logId}`, err);
            throw err;
        }
    }
    static async remove(logId) {
        try {
            await meal_model_1.Meal.findByIdAndDelete(logId);
        }
        catch (err) {
            logger_service_1.logger.error(`Failed to remove log ${logId}`, err);
            throw err;
        }
    }
}
exports.MealService = MealService;
