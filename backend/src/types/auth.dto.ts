/** The public-safe user shape returned by /auth/login and /auth/me — never includes passwordHash or tokenVersion. */
export interface SafeUserDto {
  id: string
  name: string
  email: string
  phone: string
  avatarInitials: string
  status: string
  emailVerifiedAt: Date | null
  role: {
    id: string
    name: string
    permissions: string[]
  }
}

export interface LoginResultDto {
  user: SafeUserDto
  accessToken: string
  expiresAt: number
}

export interface RefreshResultDto {
  accessToken: string
  expiresAt: number
}
