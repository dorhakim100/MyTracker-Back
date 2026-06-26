import crypto from 'crypto'
import { OAuth2Client } from 'google-auth-library'
import { User, IUser } from '../user/user.model'
import { UserService } from '../user/user.service'
import { DayService } from '../day/day.service'
import { logger } from '../../services/logger.service'
import { encryptToken } from '../../services/token-crypto.service'
import {
  GoogleProfile,
  resolveGoogleLinkOrCreateAction,
} from './google-oauth.logic'
import { AuthService } from './auth.service'

const OAUTH_SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
]

type OAuthIntent = 'login' | 'connect'

type PendingAuthPayload = {
  userId: string
  loginToken: string
  expiresAt: number
}

type OAuthStatePayload = {
  intent: OAuthIntent
  nonce: string
  returnTo?: string
}

const pendingAuthCodes = new Map<string, PendingAuthPayload>()

function getOAuthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  const redirectUri =
    process.env.NODE_ENV === 'production'
      ? process.env.GOOGLE_OAUTH_REDIRECT_URI_PROD
      : process.env.GOOGLE_OAUTH_REDIRECT_URI_DEV

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth environment variables are not configured')
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri)
}

function getFrontendUrl(): string {
  if (process.env.NODE_ENV === 'production') {
    return (
      process.env.FRONTEND_URL_PROD || 'https://mytracker-j6fc.onrender.com'
    )
  }
  return process.env.FRONTEND_URL_DEV || 'http://localhost:5173'
}

function encodeState(payload: OAuthStatePayload): string {
  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url')
}

function decodeState(state: string): OAuthStatePayload {
  try {
    const parsed = JSON.parse(
      Buffer.from(state, 'base64url').toString('utf8')
    ) as OAuthStatePayload
    if (!parsed.intent || !parsed.nonce) {
      throw new Error('Invalid OAuth state')
    }
    return parsed
  } catch {
    throw new Error('Invalid OAuth state')
  }
}

function cleanupExpiredPendingCodes() {
  const now = Date.now()
  for (const [code, payload] of pendingAuthCodes.entries()) {
    if (payload.expiresAt <= now) {
      pendingAuthCodes.delete(code)
    }
  }
}

function createPendingAuthCode(userId: string, loginToken: string): string {
  cleanupExpiredPendingCodes()
  const code = crypto.randomBytes(24).toString('base64url')
  pendingAuthCodes.set(code, {
    userId,
    loginToken,
    expiresAt: Date.now() + 60_000,
  })
  return code
}

function buildGoogleProfile(payload: {
  sub?: string | null
  email?: string | null
  name?: string | null
  picture?: string | null
}): GoogleProfile {
  if (!payload.sub || !payload.email) {
    throw new Error('Google account is missing required profile fields')
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    fullname: payload.name?.trim() || payload.email.split('@')[0],
    picture: payload.picture || undefined,
  }
}

export class GoogleOAuthService {
  static getAuthorizationUrl(intent: OAuthIntent, returnTo?: string): string {
    const client = getOAuthClient()
    const state = encodeState({
      intent,
      nonce: crypto.randomBytes(16).toString('hex'),
      returnTo,
    })

    return client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: OAUTH_SCOPES,
      state,
    })
  }

  static async handleCallback(code: string, state: string) {
    const statePayload = decodeState(state)
    const client = getOAuthClient()
    const { tokens } = await client.getToken(code)

    if (!tokens.id_token) {
      throw new Error('Google OAuth response did not include an ID token')
    }

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
    })

    const profile = buildGoogleProfile(ticket.getPayload() || {})
    const refreshToken = tokens.refresh_token
      ? encryptToken(tokens.refresh_token)
      : undefined

    if (statePayload.intent === 'connect') {
      throw new Error('Google Health connect flow is not available yet')
    }

    const user = await GoogleOAuthService.linkOrCreateUser(
      profile,
      refreshToken
    )
    const loginToken = GoogleOAuthService.getLoginTokenForUser(user)
    const pendingCode = createPendingAuthCode(String(user._id), loginToken)
    const redirectUrl = new URL('/auth/google/callback', getFrontendUrl())
    redirectUrl.searchParams.set('code', pendingCode)

    if (statePayload.returnTo) {
      redirectUrl.searchParams.set('returnTo', statePayload.returnTo)
    }

    return redirectUrl.toString()
  }

  static async exchangePendingCode(code: string) {
    cleanupExpiredPendingCodes()
    const pending = pendingAuthCodes.get(code)
    if (!pending) {
      throw new Error('Invalid or expired Google login code')
    }

    pendingAuthCodes.delete(code)
    const user = await UserService.getById(pending.userId)
    delete (user as any).password

    return {
      user,
      loginToken: pending.loginToken,
    }
  }

  static async linkOrCreateUser(
    profile: GoogleProfile,
    encryptedRefreshToken?: string
  ): Promise<IUser> {
    const existingByGoogleId = await User.findOne({
      googleId: profile.googleId,
    })
    const existingByEmail = await User.findOne({ email: profile.email })

    const action = resolveGoogleLinkOrCreateAction(
      existingByGoogleId
        ? {
            _id: String(existingByGoogleId._id),
            googleId: existingByGoogleId.googleId,
          }
        : null,
      existingByEmail
        ? {
            _id: String(existingByEmail._id),
            googleId: existingByEmail.googleId,
            email: existingByEmail.email,
          }
        : null,
      profile
    )

    let user: IUser | null = null

    switch (action.type) {
      case 'login':
        user = await User.findById(action.userId)
        break
      case 'link':
        user = await User.findByIdAndUpdate(
          action.userId,
          {
            googleId: profile.googleId,
            ...(encryptedRefreshToken
              ? { googleRefreshToken: encryptedRefreshToken }
              : {}),
            'details.fullname':
              profile.fullname ||
              existingByEmail?.details?.fullname ||
              profile.email,
            ...(profile.picture ? { 'details.imgUrl': profile.picture } : {}),
          },
          { new: true }
        )
        break
      case 'create': {
        const defaultLoggedToday = DayService.getDefaultLoggedToday()
        user = await User.create({
          email: profile.email,
          googleId: profile.googleId,
          googleRefreshToken: encryptedRefreshToken,
          details: {
            fullname: profile.fullname,
            imgUrl:
              profile.picture ||
              'https://cdn.pixabay.com/photo/2020/07/01/12/58/icon-5359553_1280.png',
            birthdate: 946684800000,
            height: 170,
            gender: 'male',
            activity: 'sedentary',
          },
          loggedToday: defaultLoggedToday._id,
        })

        await DayService.add(defaultLoggedToday as any, String(user._id))
        break
      }
    }

    if (!user) {
      throw new Error('Failed to resolve Google user')
    }

    if (encryptedRefreshToken && action.type === 'login') {
      await User.findByIdAndUpdate(user._id, {
        googleRefreshToken: encryptedRefreshToken,
      })
    }

    const aggregatedUser = await UserService.getById(String(user._id))
    delete (aggregatedUser as any).password
    return aggregatedUser as IUser
  }

  static getLoginTokenForUser(user: IUser) {
    return AuthService.getLoginToken(user)
  }
}

export function __clearPendingAuthCodesForTests() {
  pendingAuthCodes.clear()
}
