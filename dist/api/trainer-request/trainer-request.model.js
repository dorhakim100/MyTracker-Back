"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainerRequest = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const trainerRequestSchema = new mongoose_1.default.Schema({
    trainerId: {
        type: String,
        required: true,
        index: true,
    },
    traineeId: {
        type: String,
        required: true,
        index: true,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
        required: true,
        index: true,
    },
}, {
    timestamps: true,
    versionKey: false,
});
// Compound index to prevent duplicate requests and enable fast lookups
trainerRequestSchema.index({ trainerId: 1, traineeId: 1 }, { unique: true });
trainerRequestSchema.index({ traineeId: 1, status: 1 });
trainerRequestSchema.index({ trainerId: 1, status: 1 });
exports.TrainerRequest = mongoose_1.default.model('TrainerRequest', trainerRequestSchema);
