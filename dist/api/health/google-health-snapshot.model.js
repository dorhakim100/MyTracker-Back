"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleHealthSnapshot = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const googleHealthSnapshotSchema = new mongoose_1.default.Schema({
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
    steps: {
        type: Number,
        required: true,
        default: 0,
    },
    activeCaloriesKcal: {
        type: Number,
        required: true,
        default: 0,
    },
    distance: {
        type: Number,
        required: true,
        default: 0,
    },
    flightsClimbed: {
        type: Number,
        required: true,
        default: 0,
    },
    window: {
        startIso: { type: String, required: true },
        endIso: { type: String, required: true },
    },
}, {
    timestamps: true,
    versionKey: false,
});
googleHealthSnapshotSchema.index({ userId: 1, date: 1 }, { unique: true });
exports.GoogleHealthSnapshot = mongoose_1.default.model('GoogleHealthSnapshot', googleHealthSnapshotSchema);
