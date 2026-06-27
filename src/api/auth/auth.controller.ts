import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { AuthService } from './auth.service'
import { GoogleOAuthService } from './google-oauth.service'
import { logger } from '../../services/logger.service'
import { DayService } from '../day/day.service'
import { IDay } from '../day/day.model'
import type { AuthRequest } from '../../middleware/auth.middleware'

export class AuthController {
  static async login(req: Request, res: Response) {
    const { email, password } = req.body
    try {
      const user = await AuthService.login(email, password)
      const loginToken = AuthService.getLoginToken(user)

      res.cookie('loginToken', loginToken, { sameSite: 'none', secure: true })
      res.json({ user, loginToken })
    } catch (err: any) {
      logger.error('Failed to Login ' + err)
      res.status(400).send({ err: 'Failed to Login' })
    }
  }

  static async signup(req: Request, res: Response) {
    try {
      const credentials = req.body

      const account = await AuthService.signup(credentials)
      const loginToken = AuthService.getLoginToken(account)
      res.cookie('loginToken', loginToken, { sameSite: 'none', secure: true })

      const loggedToday = await DayService.getById(account.loggedToday)

      const accountToReturn = {
        ...account,
        loggedToday: loggedToday as IDay,
      }

      res.json({ user: accountToReturn, loginToken })
    } catch (err: any) {
      logger.error('Failed to signup ' + err)
      res.status(400).send({ err: 'Failed to signup' })
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      res.clearCookie('loginToken')
      res.send({ msg: 'Logged out successfully' })
    } catch (err: any) {
      logger.error('Failed to logout ' + err)
      res.status(500).send({ err: 'Failed to logout' })
    }
  }

  static googleAuth(req: Request, res: Response) {
    try {
      const intent = req.query.intent === 'connect' ? 'connect' : 'login'
      const returnTo =
        typeof req.query.returnTo === 'string' ? req.query.returnTo : undefined

      let userId: string | undefined
      if (intent === 'connect') {
        const cookieToken = req.cookies.loginToken
        const authHeader = req.headers.authorization
        const headerToken = authHeader?.startsWith('Bearer ')
          ? authHeader.slice(7)
          : null
        const loginToken = cookieToken || headerToken

        if (!loginToken) {
          return res.status(401).send({ err: 'Not authenticated' })
        }

        const decoded = jwt.verify(
          loginToken,
          process.env.JWT_SECRET as string
        ) as { _id?: string }
        userId = decoded._id

        if (!userId) {
          return res.status(401).send({ err: 'Not authenticated' })
        }
      }

      const url = GoogleOAuthService.getAuthorizationUrl(
        intent,
        returnTo,
        userId
      )
      res.redirect(url)
    } catch (err: any) {
      logger.error('Failed to start Google OAuth ' + err)
      res.status(500).send({ err: 'Failed to start Google OAuth' })
    }
  }

  static getFrontendUrl(): string {
    if (process.env.NODE_ENV === 'production') {
      return (
        process.env.FRONTEND_URL_PROD || 'https://mytracker-j6fc.onrender.com'
      )
    }
    return process.env.FRONTEND_URL_DEV || 'http://localhost:5173'
  }

  static getGoogleConnectUrl(req: AuthRequest, res: Response) {
    try {
      const userId = req.body.userId as string
      logger.info('userId', userId)
      logger.info('req', req.body)
      if (!userId) {
        return
      }

      const returnTo =
        typeof req.body?.returnTo === 'string' ? req.body.returnTo : undefined
      const url = GoogleOAuthService.getAuthorizationUrl(
        'connect',
        returnTo,
        userId
      )
      logger.info('url', url)
      res.json({ url })
    } catch (err: any) {
      logger.error('Failed to create Google connect URL ' + err)
      res.status(500).send({ err: 'Failed to create Google connect URL' })
    }
  }

  static async googleCallback(req: Request, res: Response) {
    const { code, state, error } = req.query

    const frontendUrl = AuthController.getFrontendUrl()

    if (error) {
      logger.error('Google OAuth denied ' + error)
      const redirectUrl = new URL('/auth/google/callback', frontendUrl)
      redirectUrl.searchParams.set('error', String(error))
      return res.redirect(redirectUrl.toString())
    }

    if (typeof code !== 'string' || typeof state !== 'string') {
      return res.status(400).send({ err: 'Missing Google OAuth parameters' })
    }

    try {
      const redirectUrl = await GoogleOAuthService.handleCallback(code, state)
      res.redirect(redirectUrl)
    } catch (err: any) {
      logger.error('Failed to complete Google OAuth ' + err)
      const redirectUrl = new URL('/auth/google/callback', frontendUrl)
      redirectUrl.searchParams.set('error', 'oauth_failed')
      res.redirect(redirectUrl.toString())
    }
  }

  static async completeGoogleAuth(req: Request, res: Response) {
    const { code } = req.body

    if (!code || typeof code !== 'string') {
      return res.status(400).send({ err: 'Missing Google login code' })
    }

    try {
      const { user, loginToken } = await GoogleOAuthService.exchangePendingCode(
        code
      )

      res.cookie('loginToken', loginToken, { sameSite: 'none', secure: true })
      res.json({ user, loginToken })
    } catch (err: any) {
      logger.error('Failed to complete Google login ' + err)
      res.status(400).send({ err: 'Failed to complete Google login' })
    }
  }

  static async exchangeNativeGoogleAuth(req: Request, res: Response) {
    const { serverAuthCode, idToken, intent, userId } = req.body

    if (
      !serverAuthCode ||
      typeof serverAuthCode !== 'string' ||
      !idToken ||
      typeof idToken !== 'string'
    ) {
      return res.status(400).send({ err: 'Missing Google native auth payload' })
    }

    const resolvedIntent = intent === 'connect' ? 'connect' : 'login'

    if (resolvedIntent === 'connect' && !userId) {
      return res.status(400).send({ err: 'Missing user for Google connect flow' })
    }

    try {
      const result = await GoogleOAuthService.exchangeNativeAuth({
        serverAuthCode,
        idToken,
        intent: resolvedIntent,
        userId,
      })

      if (result.loginToken) {
        res.cookie('loginToken', result.loginToken, {
          sameSite: 'none',
          secure: true,
        })
      }

      res.json(result)
    } catch (err: any) {
      logger.error('Failed to complete native Google auth ' + err)
      res.status(400).send({ err: 'Failed to complete native Google auth' })
    }
  }
}
