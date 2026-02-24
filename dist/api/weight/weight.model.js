"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Weight = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const weightSchema = new mongoose_1.default.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    kg: {
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
weightSchema.index({ userId: 1, createdAt: -1 });
exports.Weight = mongoose_1.default.model('Weight', weightSchema);
