'use strict'
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod }
  }
Object.defineProperty(exports, '__esModule', { value: true })
exports.User = void 0
const mongoose_1 = __importDefault(require('mongoose'))
const user_service_1 = require('./user.service')
const defaultGoal = user_service_1.UserService.getDefaultGoal()
// const defaultLoggedToday = UserService.getLoggedToday()
const userSchema = new mongoose_1.default.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullname: {
      type: String,
      required: true,
    },
    imgUrl: {
      type: String,
    },
    favoriteItems: {
      type: Object,
      default: { food: [], product: [] },
    },
    goals: {
      type: [Object],
      default: [defaultGoal],
    },
    currGoal: {
      type: Object,
      default: defaultGoal,
    },
    loggedToday: {
      type: String,
      // default: defaultLoggedToday,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)
exports.User = mongoose_1.default.model('User', userSchema)
