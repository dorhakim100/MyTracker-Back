"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExerciseModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const exerciseSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        index: true,
    },
    muscleGroups: {
        type: [String],
        required: true,
        default: [],
    },
    image: {
        type: String,
        required: true,
    },
    equipment: {
        type: [String],
        required: true,
        default: [],
    },
    exerciseId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    mainMuscles: {
        type: [String],
        required: false,
        default: [],
    },
    secondaryMuscles: {
        type: [String],
        required: false,
        default: [],
    },
    equipments: {
        type: [String],
        required: false,
        default: [],
    },
    instructions: {
        type: [String],
        required: false,
        default: [],
    },
    popularityScore: {
        type: Number,
        required: false,
        default: 0,
    },
}, {
    timestamps: true,
    versionKey: false,
});
// Indexes for efficient searching
exerciseSchema.index({ name: 'text' }); // Text index for name searches
exerciseSchema.index({ exerciseId: 1 }); // Index for exerciseId lookups
exerciseSchema.index({ muscleGroups: 1 }); // Index for muscle group filtering
exerciseSchema.index({ equipment: 1 }); // Index for equipment filtering
exports.ExerciseModel = mongoose_1.default.model('Exercise', exerciseSchema);
