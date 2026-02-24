"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Set = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const setSchema = new mongoose_1.default.Schema({
    sessionId: {
        type: String,
        required: true,
        index: true,
    },
    exerciseId: {
        type: String,
        required: true,
        index: true,
    },
    userId: {
        type: String,
        required: true,
        index: true,
    },
    setNumber: {
        type: Number,
        required: true,
    },
    weight: {
        type: Object,
        required: true,
    },
    reps: {
        type: Object,
        required: true,
    },
    rpe: {
        type: Object,
        required: false,
    },
    rir: {
        type: Object,
        required: false,
    },
    isDone: {
        type: Boolean,
        required: true,
        default: false,
    },
}, {
    timestamps: true,
    versionKey: false,
});
setSchema.index({ sessionId: 1, exerciseId: 1, setNumber: 1 });
exports.Set = mongoose_1.default.model('Set', setSchema);
