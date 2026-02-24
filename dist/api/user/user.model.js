"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// const defaultGoal = UserService.getDefaultGoal()
// const defaultLoggedToday = UserService.getLoggedToday()
const userSchema = new mongoose_1.default.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        required: false,
    },
    details: {
        type: Object,
        default: {
            fullname: '',
            imgUrl: 'https://cdn.pixabay.com/photo/2020/07/01/12/58/icon-5359553_1280.png',
            birthdate: 946684800000,
            height: 170,
            gender: 'male',
            activity: 'sedentary',
        },
    },
    favoriteItems: {
        type: Array,
        default: [],
    },
    // favoriteItems: {
    //   type: Object,
    //   default: { food: [], product: [] },
    // },
    goals: {
        type: [Object],
        default: [],
    },
    currGoal: {
        type: Object,
        default: {},
    },
    loggedToday: {
        type: String,
        // default: defaultLoggedToday,
    },
    mealsIds: {
        type: Array,
        default: [],
    },
    weightsIds: {
        type: Array,
        default: [],
    },
    goalsIds: {
        type: Array,
        default: [],
    },
    isTrainer: {
        type: Boolean,
        default: false,
    },
    trainersIds: {
        type: [String],
        default: [],
    },
    isAddedByTrainer: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
    versionKey: false,
});
exports.User = mongoose_1.default.model('User', userSchema);
