import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User, IUser } from '../user/user.model'
import { logger } from '../../services/logger.service'
import { DayService } from '../day/day.service'
import { IDay } from '../day/day.model'
import { UserService } from '../user/user.service'

export class AuthService {
  static async login(email: string, password: string): Promise<IUser> {
    const user = await User.findOne({ email })

    if (!user) throw new Error('Invalid email or password')

    const match = await bcrypt.compare(password, user.password as string)
    if (!match) throw new Error('Invalid email or password')

    const aggregatedUser = await UserService.getById(user._id as string)
    delete (aggregatedUser as any).password
    return aggregatedUser as IUser
  }

  static async signup(credentials: {
    email: string
    password: string
    fullname: string
  }): Promise<IUser> {
    const saltRounds = 10
    logger.debug(`Auth.signup: ${credentials.email}`)

    if (!credentials.email || !credentials.password || !credentials.fullname)
      throw new Error('Missing required signup information')

    const userExist = await User.findOne({ email: credentials.email })
    console.log('userExist', userExist)
    if (userExist) throw new Error('Email already exists')

    const hash = await bcrypt.hash(credentials.password, saltRounds)
    credentials.password = hash

    const defaultLoggedToday = DayService.getDefaultLoggedToday()

    const user = await User.create({
      ...credentials,
      loggedToday: defaultLoggedToday._id,
    })

    const createdDay = await DayService.add(
      defaultLoggedToday as any,
      user._id as string
    )

    const userObj = user.toObject()
    delete (userObj as any).password
    ;(userObj as any).loggedToday = createdDay

    return userObj as IUser
  }

  static getLoginToken(user: IUser) {
    const userInfo = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
    }
    return jwt.sign(userInfo, process.env.JWT_SECRET as string, {
      expiresIn: '7d',
    })
  }
}
