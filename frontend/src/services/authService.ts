import type { AuthSession, AuthUser, LoginCredentials } from '@/types/auth'
import { ApiError, simulateRequest } from '@/services/simulateRequest'

const SESSION_TTL_MS = 1000 * 60 * 60 * 8 // 8 hours

interface DemoAccount {
  password: string
  user: AuthUser
}

/**
 * Stand-in user directory. A real backend would validate credentials
 * server-side and issue a signed JWT — this fakes both.
 */
const demoAccounts: Record<string, DemoAccount> = {
  'farmer@keepxtra.com': {
    password: 'password123',
    user: {
      id: 'farmer-001',
      name: 'Kwame Asante',
      email: 'farmer@keepxtra.com',
      role: 'farmer',
      avatarInitials: 'KA',
    },
  },
  'admin@keepxtra.com': {
    password: 'admin123',
    user: {
      id: 'admin-001',
      name: 'Ama Serwaa',
      email: 'admin@keepxtra.com',
      role: 'admin',
      avatarInitials: 'AS',
    },
  },
}

function createMockToken(user: AuthUser) {
  // Not a real JWT — just a base64 payload that looks like one, so the
  // shape (header.payload.signature) matches what a real API would return.
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'MOCK' }))
  const payload = btoa(JSON.stringify({ sub: user.id, role: user.role, iat: Date.now() }))
  return `${header}.${payload}.mock-signature`
}

async function login(credentials: LoginCredentials): Promise<AuthSession> {
  const account = demoAccounts[credentials.email.trim().toLowerCase()]

  if (!account || account.password !== credentials.password) {
    return simulateRequest(null, 500).then(() => {
      throw new ApiError('Invalid email or password.', 401)
    })
  }

  const session: AuthSession = {
    user: account.user,
    token: createMockToken(account.user),
    expiresAt: Date.now() + SESSION_TTL_MS,
  }

  return simulateRequest(session)
}

async function logout(): Promise<void> {
  return simulateRequest(undefined, 200)
}

/** Simulates a "verify token" call a real backend would expose. */
async function validateSession(session: AuthSession): Promise<AuthSession | null> {
  if (session.expiresAt < Date.now()) return simulateRequest(null, 150)
  return simulateRequest(session, 150)
}

export const authService = {
  login,
  logout,
  validateSession,
}
