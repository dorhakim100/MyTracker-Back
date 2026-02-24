"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Session = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const sessionSchema = new mongoose_1.default.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    date: {
        type: String,
        required: true,
        index: true,
    },
    workoutId: {
        type: String || null,
        required: false,
        default: null,
    },
    exercises: {
        type: [Object],
        required: true,
        default: [],
    },
    setsIds: {
        type: [String],
        required: true,
        default: [],
    },
    instructionsId: {
        type: String || null,
        required: false,
        default: null,
    },
}, {
    timestamps: true,
    versionKey: false,
});
sessionSchema.index({ userId: 1, date: 1 }, { unique: false });
exports.Session = mongoose_1.default.model('Session', sessionSchema);
