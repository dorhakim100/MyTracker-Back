"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BodyFatEstimate = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bodyFatEstimateSchema = new mongoose_1.default.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    minPercent: {
        type: Number,
        required: true,
    },
    maxPercent: {
        type: Number,
        required: true,
    },
    note: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    weightKg: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Number,
        required: true,
        default: () => Date.now(),
        index: true,
    },
}, {
    versionKey: false,
});
bodyFatEstimateSchema.index({ userId: 1, createdAt: -1 });
exports.BodyFatEstimate = mongoose_1.default.model('BodyFatEstimate', bodyFatEstimateSchema);
