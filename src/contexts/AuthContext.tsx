import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AuthSession, AuthUser, LoginCredentials } from '@/types/auth'
import { authService } from '@/services/authService'
import { readStorage, removeStorage, writeStorage } from '@/utils/storage'

const SESSION_KEY = 'keepxtra.session'
const REMEMBER_TTL_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  isInitializing: boolean
  isLoggingIn: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<AuthUser>
  logout: () => Promise<void>
  clearError: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function restore() {
      const stored = readStorage<AuthSession>(SESSION_KEY)
      if (!stored) {
        if (!cancelled) setIsInitializing(false)
        return
      }
      const validated = await authService.validateSession(stored)
      if (cancelled) return
      if (validated) {
        setUser(validated.user)
      } else {
        removeStorage(SESSION_KEY)
      }
      setIsInitializing(false)
    }

    restore()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoggingIn(true)
    setError(null)
    try {
      const session = await authService.login(credentials)
      const persisted: AuthSession = credentials.rememberMe
        ? { ...session, expiresAt: Date.now() + REMEMBER_TTL_MS }
        : session
      writeStorage(SESSION_KEY, persisted)
      setUser(session.user)
      return session.user
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign in. Please try again.'
      setError(message)
      throw err
    } finally {
      setIsLoggingIn(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await authService.logout()
    removeStorage(SESSION_KEY)
    setUser(null)
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isInitializing,
      isLoggingIn,
      error,
      login,
      logout,
      clearError,
    }),
    [user, isInitializing, isLoggingIn, error, login, logout, clearError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
