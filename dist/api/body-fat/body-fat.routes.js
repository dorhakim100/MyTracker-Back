"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bodyFatRoutes = void 0;
const express_1 = require("express");
const body_fat_controller_1 = require("./body-fat.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post('/estimate', auth_middleware_1.requireAuth, body_fat_controller_1.BodyFatController.estimate);
exports.bodyFatRoutes = router;
