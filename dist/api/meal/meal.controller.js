"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MealController = void 0;
const meal_service_1 = require("./meal.service");
const logger_service_1 = require("../../services/logger.service");
class MealController {
    static async getMeals(req, res) {
        try {
            const meals = await meal_service_1.MealService.query(req.query);
            res.json(meals);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get meals', err);
            res.status(500).send({ err: 'Failed to get meals' });
        }
    }
    static async getMealsBulk(req, res) {
        try {
            const { mealIds } = req.query;
            const meals = await meal_service_1.MealService.getByMealIds(mealIds);
            res.json(meals);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get meals bulk', err);
            res.status(500).send({ err: 'Failed to get meals bulk' });
        }
    }
    static async getMeal(req, res) {
        try {
            const meal = await meal_service_1.MealService.getById(req.params.id);
            res.json(meal);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to get meal', err);
            res.status(500).send({ err: 'Failed to get meal' });
        }
    }
    static async addMeal(req, res) {
        try {
            const meal = req.body;
            // log.createdBy = req.user?._id as string
            const addedMeal = await meal_service_1.MealService.add(meal);
            res.json(addedMeal);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to add meal', err);
            res.status(500).send({ err: 'Failed to add meal' });
        }
    }
    static async updateMeal(req, res) {
        try {
            const meal = await meal_service_1.MealService.update(req.params.id, req.body);
            res.json(meal);
        }
        catch (err) {
            logger_service_1.logger.error('Failed to update meal', err);
            res.status(500).send({ err: 'Failed to update meal' });
        }
    }
    static async deleteMeal(req, res) {
        try {
            await meal_service_1.MealService.remove(req.params.id);
            res.send({ msg: 'Deleted successfully' });
        }
        catch (err) {
            logger_service_1.logger.error('Failed to delete meal', err);
            res.status(500).send({ err: 'Failed to delete meal' });
        }
    }
}
exports.MealController = MealController;
