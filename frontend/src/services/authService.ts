import type { AuthSession, AuthUser, LoginCredentials } from '@/types/auth'
import { ApiError } from '@/services/simulateRequest'

/**
 * Real backend calls, replacing the mock account directory this file used
 * to hold. `credentials: 'include'` on every call is what lets the browser
 * send/receive the httpOnly refresh-token cookie the backend sets on login
 * (see backend/src/utils/cookies.ts) — the backend's CORS config already
 * allows this (`credentials: true`) for `CORS_ORIGIN`.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api/v1'

/** Shape of `role` on POST /auth/login and POST /auth/refresh's paired user data — see backend/src/types/auth.dto.ts#SafeUserDto. */
interface BackendRole {
  id: string
  name: string
  permissions: string[]
}

interface BackendLoginUser {
  id: string
  name: string
  email: string
  avatarInitials: string
  role: BackendRole
}

interface BackendLoginData {
  user: BackendLoginUser
  accessToken: string
  expiresAt: number
}

interface BackendRefreshData {
  accessToken: string
  expiresAt: number
}

/**
 * Shape of GET /auth/me — the backend returns `req.user` there (the
 * `AuthenticatedUser` request-scoped view), which is flat (`roleName`)
 * rather than login/refresh's nested `role: {name, ...}` object. Two real,
 * slightly different response shapes for "the current user" — not a
 * frontend bug, an existing backend API inconsistency worth normalizing
 * here rather than in every caller.
 */
interface BackendCurrentUser {
  id: string
  name: string
  email: string
  avatarInitials: string
  roleName: string
}

interface ApiErrorBody {
  error?: { message?: string }
}

/**
 * Every non-2xx response from the backend uses this envelope
 * (`{ success: false, error: { message, code } }`) — surface the real
 * message so callers (AuthContext, forms) show the backend's actual
 * validation/auth error instead of a generic one.
 */
async function parseResponse<T>(res: Response): Promise<T> {
  const body: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    const message = (body as ApiErrorBody | null)?.error?.message ?? 'Something went wrong. Please try again.'
    throw new ApiError(message, res.status)
  }

  return (body as { data: T }).data
}

/**
 * The frontend's `AuthUser.role` is a binary `'farmer' | 'admin'` that
 * drives which portal shell to render — the backend's real RBAC model has
 * many operations role *names* (Manager, Operations, Finance, ...) that all
 * map to the same admin shell here. Fine-grained permission gating within
 * the admin portal (`usePermissions`) is unaffected by this and unchanged.
 */
function toAuthUser(user: { id: string; name: string; email: string; avatarInitials: string }, roleName: string): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: roleName === 'Farmer' ? 'farmer' : 'admin',
    avatarInitials: user.avatarInitials,
  }
}

async function login(credentials: LoginCredentials): Promise<AuthSession> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(credentials),
  })
  const data = await parseResponse<BackendLoginData>(res)

  return {
    user: toAuthUser(data.user, data.user.role.name),
    token: data.accessToken,
    expiresAt: data.expiresAt,
  }
}

async function logout(): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' })
}

/**
 * Restores a session on app load. The stored access token has almost
 * certainly already expired by the time this runs (15-minute default
 * lifetime vs. up to 30 days of "remember me" persistence) — rather than
 * checking the stale `expiresAt` first, this always attempts a silent
 * refresh via the httpOnly cookie, then fetches the current user with the
 * fresh token. Any failure (expired/revoked refresh token, network error)
 * is treated as "no session" — the caller falls back to the login page.
 */
async function validateSession(_session: AuthSession): Promise<AuthSession | null> {
  try {
    const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
    const refreshData = await parseResponse<BackendRefreshData>(refreshRes)

    const meRes = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${refreshData.accessToken}` },
      credentials: 'include',
    })
    const currentUser = await parseResponse<BackendCurrentUser>(meRes)

    return {
      user: toAuthUser(currentUser, currentUser.roleName),
      token: refreshData.accessToken,
      expiresAt: refreshData.expiresAt,
    }
  } catch {
    return null
  }
}

export const authService = {
  login,
  logout,
  validateSession,
}
