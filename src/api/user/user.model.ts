import { Goal } from '@/types/Goal/Goal'
import mongoose from 'mongoose'
import { UserService } from './user.service'
import { LoggedToday } from '@/types/LoggedToday/LoggedToday'

export interface IUser extends mongoose.Document {
  email: string
  password?: string
  fullname: string
  imgUrl?: string
  createdAt: Date
  updatedAt: Date
  favoriteItems: { food: string[]; product: string[] }
  loggedToday: string
  currGoal: Goal
  goals: Goal[]
}

const defaultGoal = UserService.getDefaultGoal()
// const defaultLoggedToday = UserService.getLoggedToday()

const userSchema = new mongoose.Schema(
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

export const User = mongoose.model<IUser>('User', userSchema)
