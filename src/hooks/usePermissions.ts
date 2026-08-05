import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ROLE_PERMISSIONS, type OperationsRole, type Permission } from '@/types/permissions'

/**
 * Only one real admin demo account exists today, so it's mapped to
 * 'Super Admin'. Swapping in real per-employee operations roles later is a
 * one-line change here — every permission check in the UI already reads
 * from this hook rather than checking `user.role === 'admin'` directly.
 */
function resolveOperationsRole(authRole: string | undefined): OperationsRole | null {
  if (authRole === 'admin') return 'Super Admin'
  return null
}

export function usePermissions() {
  const { user } = useAuth()
  const operationsRole = resolveOperationsRole(user?.role)

  const permissions = useMemo(() => (operationsRole ? ROLE_PERMISSIONS[operationsRole] : []), [operationsRole])

  function can(permission: Permission) {
    return permissions.includes(permission)
  }

  return { operationsRole, permissions, can }
}
