"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatGPTRoutes = void 0;
const express_1 = require("express");
const chatGPT_controller_1 = require("./chatGPT.controller");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
// router.post('/', requireAuth, ChatGPTController.chat)
router.post('/change-exercise', auth_middleware_1.requireAuth, chatGPT_controller_1.ChatGPTController.changeExercise);
exports.chatGPTRoutes = router;
