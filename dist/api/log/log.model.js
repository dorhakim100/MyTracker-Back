"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const logSchema = new mongoose_1.default.Schema({
    // _id: {
    //   type: mongoose.Types.ObjectId,
    //   required: true,
    // },
    itemId: {
        type: String,
        required: false,
    },
    macros: {
        type: Object,
        required: true,
    },
    meal: {
        type: String,
        required: true,
    },
    numberOfServings: {
        type: Number,
        required: true,
    },
    servingSize: {
        type: Number,
        required: true,
    },
    source: {
        type: String,
        required: true,
    },
    mealId: {
        type: String,
        required: false,
    },
    time: {
        type: Number,
        required: true,
    },
    //
    createdBy: {
        type: String,
        // ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: false,
    },
    isFixedMenuLog: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.Log = mongoose_1.default.model('Log', logSchema);
