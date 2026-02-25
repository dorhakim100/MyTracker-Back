"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Menu = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const menuSchema = new mongoose_1.default.Schema({
    userId: {
        type: String,
        required: true,
    },
    menuLogs: {
        type: [{ type: mongoose_1.default.Schema.Types.ObjectId, ref: 'Log' }],
        default: () => [],
    },
    isSelected: { type: Boolean, default: false },
    name: { type: String, required: false, default: 'New Menu' },
}, {
    timestamps: true,
    versionKey: false,
});
exports.Menu = mongoose_1.default.model('Menu', menuSchema);
