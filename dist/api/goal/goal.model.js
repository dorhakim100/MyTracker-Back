"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoalModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const goalSchema = new mongoose_1.default.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    dailyCalories: {
        type: Number,
        required: true,
    },
    macros: {
        type: Object,
        default: {},
    },
    startDate: {
        type: Number,
        required: true,
        index: true,
    },
    endDate: {
        type: Number,
        default: null,
    },
    isSelected: {
        type: Boolean,
        default: false,
        index: true,
    },
    target: {
        type: String,
        enum: ['lose', 'maintain', 'gain'],
        required: true,
    },
    targetWeight: {
        type: Number,
        required: true,
    },
    updatedAt: {
        type: Number,
        default: () => Date.now(),
    },
}, {
    versionKey: false,
});
goalSchema.index({ userId: 1, startDate: -1 });
exports.GoalModel = mongoose_1.default.model('Goal', goalSchema);
