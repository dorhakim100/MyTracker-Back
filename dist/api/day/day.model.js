"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Day = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const daySchema = new mongoose_1.default.Schema({
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
    logs: {
        type: [String],
        default: [],
        required: true,
    },
    calories: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
    versionKey: false,
});
daySchema.index({ userId: 1, date: 1 }, { unique: true });
exports.Day = mongoose_1.default.model('Day', daySchema);
