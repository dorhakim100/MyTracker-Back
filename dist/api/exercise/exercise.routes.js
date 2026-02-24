"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exerciseRoutes = void 0;
const express_1 = require("express");
const exercise_controller_1 = require("./exercise.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Exercise CRUD routes
router.get('/', exercise_controller_1.ExerciseController.getExercises);
router.get('/alternate', exercise_controller_1.ExerciseController.getAlternateExercises);
router.get('/search', exercise_controller_1.ExerciseController.searchExercises);
router.get('/search/muscle-groups', exercise_controller_1.ExerciseController.searchExercisesByMuscleGroups);
router.get('/search/equipment', exercise_controller_1.ExerciseController.searchExercisesByEquipment);
router.get('/exercise-id/bulk', exercise_controller_1.ExerciseController.getExercisesByExerciseIds);
router.get('/exercise-id', exercise_controller_1.ExerciseController.getExerciseByExerciseId);
router.get('/:id', exercise_controller_1.ExerciseController.getExercise);
// Protected routes (require authentication)
router.post('/', auth_middleware_1.requireAuth, exercise_controller_1.ExerciseController.addExercise);
router.post('/bulk', auth_middleware_1.requireAuth, exercise_controller_1.ExerciseController.addExercises);
router.put('/exercise-id', auth_middleware_1.requireAuth, exercise_controller_1.ExerciseController.updateExerciseByExerciseId);
router.put('/:id', auth_middleware_1.requireAuth, exercise_controller_1.ExerciseController.updateExercise);
router.delete('/exercise-id', auth_middleware_1.requireAuth, exercise_controller_1.ExerciseController.deleteExerciseByExerciseId);
router.delete('/:id', auth_middleware_1.requireAuth, exercise_controller_1.ExerciseController.deleteExercise);
exports.exerciseRoutes = router;
