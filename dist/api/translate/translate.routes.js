"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateRoutes = void 0;
const express_1 = require("express");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const translate_controller_1 = require("./translate.controller");
const router = (0, express_1.Router)();
router.get('/', auth_middleware_1.requireAuth, translate_controller_1.TranslateController.translate);
exports.translateRoutes = router;
