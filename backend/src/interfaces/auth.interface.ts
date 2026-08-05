/** The shape of the signed JWT access-token payload. */
export interface AccessTokenPayload {
  sub: string
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
  roleId: string
  roleName: string
  permissions: string[]
}
