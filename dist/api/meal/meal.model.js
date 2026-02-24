"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Meal = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mealSchema = new mongoose_1.default.Schema({
    // _id: {
    //   type: mongoose.Types.ObjectId,
    //   required: true,
    // },
    items: {
        type: [Object],
        required: true,
        default: [],
    },
    macros: {
        type: Object,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    //
    createdBy: {
        type: String,
        // ref: 'User',
        required: true,
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.Meal = mongoose_1.default.model('Meal', mealSchema);
