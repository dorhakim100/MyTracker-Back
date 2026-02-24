"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalController = void 0;
const goal_service_1 = require("./goal.service");
class GoalController {
    static async listByUser(req, res) {
        try {
            const { userId } = req.params;
            const goals = await goal_service_1.GoalService.listByUser(userId);
            res.json(goals);
        }
        catch (err) {
            res.status(500).send({ err: 'Failed to list goals' });
        }
    }
    static async getById(req, res) {
        try {
            const goal = await goal_service_1.GoalService.getById(req.params.id);
            if (!goal)
                return res.status(404).send({ err: 'Goal not found' });
            res.json(goal);
        }
        catch (err) {
            res.status(500).send({ err: 'Failed to get goal' });
        }
    }
    static async add(req, res) {
        try {
            const added = await goal_service_1.GoalService.add(req.body);
            res.json(added);
        }
        catch (err) {
            res.status(400).send({ err: err.message || 'Failed to add goal' });
        }
    }
    static async update(req, res) {
        try {
            const updated = await goal_service_1.GoalService.update(req.params.id, req.body);
            res.json(updated);
        }
        catch (err) {
            res.status(400).send({ err: err.message || 'Failed to update goal' });
        }
    }
    static async remove(req, res) {
        try {
            await goal_service_1.GoalService.remove(req.params.id);
            res.send({ msg: 'Deleted successfully' });
        }
        catch (err) {
            res.status(400).send({ err: err.message || 'Failed to remove goal' });
        }
    }
    static async select(req, res) {
        try {
            const { userId, goalId } = req.body;
            const updated = await goal_service_1.GoalService.select(userId, goalId);
            res.json(updated);
        }
        catch (err) {
            res.status(400).send({ err: err.message || 'Failed to select goal' });
        }
    }
}
exports.GoalController = GoalController;
