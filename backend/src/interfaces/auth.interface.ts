/** The shape of the signed JWT access-token payload. */
export interface AccessTokenPayload {
  sub: string
  /** Compared against `User.tokenVersion` on every request — mismatched means the token was invalidated by a password change/reset. */
  tokenVersion: number
  /** Random per-token id — guarantees two tokens signed for the same user in the same second still differ. Not otherwise checked. */
  jti?: string
  iat?: number
  exp?: number
}

/**
 * What `authenticate` attaches to `req.user` after verifying a token and
 * hydrating the user's current role/permissions from the database. Kept
 * separate from the Mongoose `IUser` document — this is the minimal,
 * request-scoped view every downstream middleware/handler needs.
 */
export interface AuthenticatedUser {
  id: string
  email: string
  name: string
  phone: string
  avatarInitials: string
  status: string
  emailVerifiedAt: Date | null
  roleId: string
  roleName: string
  permissions: string[]
}
