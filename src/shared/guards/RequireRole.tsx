import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/features/auth/auth-context'
import type { Role } from './permissions'

interface RequireRoleProps {
  role: Role
  children: ReactNode
  /** Para onde mandar quem não tem acesso. Default: dashboard. */
  fallback?: string
}

export function RequireRole({ role, children, fallback = '/' }: RequireRoleProps) {
  const { user } = useAuth()
  if (!user || user.role !== role) {
    return <Navigate to={fallback} replace />
  }
  return <>{children}</>
}
