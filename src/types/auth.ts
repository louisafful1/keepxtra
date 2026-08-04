export type UserRole = 'farmer' | 'admin'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatarInitials: string
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface AuthSession {
  user: AuthUser
  token: string
  expiresAt: number
}
