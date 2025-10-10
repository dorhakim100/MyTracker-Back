import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { IUser } from '../api/user/user.model'
import { asyncLocalStorage, getLoggedinUser } from './setupAls.middleware'

interface JWTPayload {
  id: string
  email: string
  fullname: string
  iat: number
  exp: number
  isGuest?: boolean
}

interface AuthRequest extends Request {
  user?: JWTPayload
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  let token: string | undefined

  const loginToken = req.cookies.loginToken
  const authHeader = req.headers.authorization

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1]
  } else if (loginToken) {
    token = loginToken
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' })
    return
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JWTPayload

    if (decoded.isGuest)
      return res.status(401).json({ message: 'Not authorized, token failed' })

    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' })
    return
  }
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const loginToken = req.cookies.loginToken

  if (!loginToken) return res.status(401).send('Not Authenticated')
  const token = loginToken
  // Verify token

  const loggedinUser = jwt.verify(
    token,
    process.env.JWT_SECRET as string
  ) as JWTPayload

  if (!loggedinUser) return res.status(401).send('Not Authenticated')

  const { id, userId } = req.body

  if (id !== loggedinUser.id) return res.status(401).send('Not Authenticated')

  // if (config.isGuestMode && !loggedinUser) {
  //   req.loggedinUser = { _id: '', fullname: 'Guest' }
  //   return next()
  // }
  next()
}
