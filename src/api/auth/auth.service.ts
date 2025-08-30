import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User, IUser } from '../user/user.model'
import { logger } from '../../services/logger.service'

export class AuthService {
  static async login(email: string, password: string): Promise<IUser> {
    const user = await User.findOne({ email })
    console.log(password)

    console.log('user', user)

    if (!user) throw new Error('Invalid email or password')

    const match = await bcrypt.compare(password, user.password as string)
    if (!match) throw new Error('Invalid email or password')

    delete user.password
    return user
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

    console.log('credentials', credentials)

    const user = await User.create(credentials)
    delete user.password
    return user
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
