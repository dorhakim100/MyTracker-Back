"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const itemSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        index: true,
    },
    searchId: {
        type: String,
        index: true,
    },
    searchTerm: {
        type: String,
        required: false,
        index: true,
    },
    image: {
        type: String,
    },
    macros: {
        type: Object,
        required: true,
    },
    type: {
        type: String,
        enum: ['food', 'product', 'meal', 'custom', ''],
        default: '',
    },
    items: {
        type: [Object],
        required: false,
    },
}, {
    timestamps: true,
    versionKey: false,
});
// Compound index for efficient search term lookups
itemSchema.index({ searchTerm: 1, searchId: 1 });
itemSchema.index({ name: 'text' }); // Text index for name searches
exports.ItemModel = mongoose_1.default.model('Item', itemSchema);
