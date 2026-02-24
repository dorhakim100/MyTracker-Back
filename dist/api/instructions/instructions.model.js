"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Instructions = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const instructionsSchema = new mongoose_1.default.Schema({
    workoutId: {
        type: String,
        required: true,
        index: true,
    },
    exercises: {
        type: [Object],
        required: true,
    },
    weekNumber: {
        type: Number,
        required: true,
    },
    timesPerWeek: {
        type: Number,
        required: true,
        default: 1,
    },
    doneTimes: {
        type: Number,
        required: true,
        default: 0,
    },
    isDone: {
        type: Boolean,
        default: false,
    },
    isFinished: {
        type: Boolean,
        required: true,
        default: false,
    },
    isEmpty: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: false,
    versionKey: false,
});
exports.Instructions = mongoose_1.default.model('Instructions', instructionsSchema);
