import { Goal } from '@/types/Goal/Goal'
import mongoose from 'mongoose'
import { UserService } from './user.service'
import { LoggedToday } from '@/types/LoggedToday/LoggedToday'

export interface IUser extends mongoose.Document {
  email: string
  password?: string
  details: UserDetails
  createdAt: Date
  updatedAt: Date
  // favoriteItems: { food: string[]; product: string[] }
  favoriteItems: string[]
  loggedToday: string
  currGoal: Goal
  goals: Goal[]
  mealsIds: string[]
  weightsIds: string[]
  goalsIds: string[]
}

interface UserDetails {
  fullname: string
  imgUrl: string
  birthdate: number
  height: number
  gender: string
}

// const defaultGoal = UserService.getDefaultGoal()
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

    details: {
      type: Object,
      default: {
        fullname: '',
        imgUrl: '',
        birthdate: 0,
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

export const User = mongoose.model<IUser>('User', userSchema)
