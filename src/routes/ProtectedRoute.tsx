import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/auth'

const roleHome: Record<UserRole, string> = {
  farmer: '/portal',
  admin: '/admin',
}

interface ProtectedRouteProps {
  allowedRole: UserRole
}

export function ProtectedRoute({ allowedRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, isInitializing } = useAuth()

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <div className="size-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== allowedRole) {
    return <Navigate to={roleHome[user.role]} replace />
  }

  return <Outlet />
}
