import { resolveGoogleLinkOrCreateAction } from './google-oauth.logic'

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message)
  }
}

const profile = {
  googleId: 'google-123',
  email: 'user@example.com',
  fullname: 'Test User',
}

const loginAction = resolveGoogleLinkOrCreateAction(
  { _id: 'user-1', googleId: 'google-123' },
  null,
  profile
)
assert(loginAction.type === 'login', 'expected login when googleId exists')

const linkAction = resolveGoogleLinkOrCreateAction(
  null,
  { _id: 'user-2', email: 'user@example.com' },
  profile
)
assert(linkAction.type === 'link', 'expected link when email exists')

const createAction = resolveGoogleLinkOrCreateAction(null, null, profile)
assert(createAction.type === 'create', 'expected create for new profile')

try {
  resolveGoogleLinkOrCreateAction(
    null,
    { _id: 'user-3', googleId: 'other-google-id', email: 'user@example.com' },
    profile
  )
  throw new Error('expected conflict error')
} catch (err) {
  assert(
    err instanceof Error &&
      err.message.includes('different Google account'),
    'expected email/google conflict error'
  )
}

console.log('google-oauth.logic tests passed')
