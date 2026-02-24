"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Workout = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const workoutSchema = new mongoose_1.default.Schema({
    // Add your workout schema fields here
    forUserId: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    exercises: {
        type: [Object],
        required: true,
    },
    muscleGroups: {
        type: [String],
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    isEmpty: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.Workout = mongoose_1.default.model('Workout', workoutSchema);
