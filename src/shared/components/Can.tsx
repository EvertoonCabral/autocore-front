import type { ReactNode } from 'react'
import { useAuth } from '@/features/auth/auth-context'
import { canPerform, type AdminOnlyPermission } from '@/shared/guards/permissions'

interface CanProps {
  permission: AdminOnlyPermission
  children: ReactNode
  /** Conteúdo a renderizar quando o usuário não tem permissão. Default: nada. */
  fallback?: ReactNode
}

/** Renderiza `children` apenas se a role atual permite a ação. UX-only — back é fonte de verdade. */
export function Can({ permission, children, fallback = null }: CanProps) {
  const allowed = useCan(permission)
  return <>{allowed ? children : fallback}</>
}

/** Hook complementar — útil para `disabled={!useCan('...')}` em botões. */
export function useCan(permission: AdminOnlyPermission): boolean {
  const { user } = useAuth()
  return canPerform(user?.role as 'Admin' | 'Operador' | undefined, permission)
}
