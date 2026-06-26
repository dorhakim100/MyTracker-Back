export type GoogleProfile = {
  googleId: string
  email: string
  fullname: string
  picture?: string
}

export type GoogleUserLookup = {
  _id: string
  googleId?: string | null
  email?: string
}

export type GoogleLinkOrCreateAction =
  | { type: 'login'; userId: string }
  | { type: 'link'; userId: string }
  | { type: 'create'; profile: GoogleProfile }

export function resolveGoogleLinkOrCreateAction(
  existingByGoogleId: GoogleUserLookup | null,
  existingByEmail: GoogleUserLookup | null,
  profile: GoogleProfile
): GoogleLinkOrCreateAction {
  if (existingByGoogleId) {
    return { type: 'login', userId: existingByGoogleId._id }
  }

  if (existingByEmail) {
    if (
      existingByEmail.googleId &&
      existingByEmail.googleId !== profile.googleId
    ) {
      throw new Error('This email is already linked to a different Google account')
    }
    return { type: 'link', userId: existingByEmail._id }
  }

  return { type: 'create', profile }
}
