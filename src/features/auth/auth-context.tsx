import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, UNAUTHORIZED_EVENT } from '@/api/client'
import { unwrap } from '@/api/envelope'
import type { UsuarioDto } from '@/api/types'
import type { Role } from '@/shared/guards/permissions'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous'

export interface AuthState {
  status: AuthStatus
  user?: UsuarioDto & { role: Role }
  /** Re-executa GET /api/auth/me. Útil após login ou logout. */
  refresh: () => Promise<void>
  /** Força status `anonymous` localmente — usado pelo logout. */
  signOut: () => void
}

const AuthContext = createContext<AuthState | null>(null)

const ME_QUERY_KEY = ['auth', 'me'] as const

async function fetchMe(): Promise<UsuarioDto> {
  const { data, response } = await api.GET('/api/auth/me')
  if (response.status === 401) {
    throw new Response(null, { status: 401 })
  }
  if (!data) {
    throw new Error('Resposta vazia em /api/auth/me')
  }
  return unwrap<UsuarioDto>(data)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: fetchMe,
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
  })

  // 401 vindo de qualquer request → invalida me e cai para `anonymous`.
  useEffect(() => {
    function handleUnauthorized() {
      queryClient.setQueryData(ME_QUERY_KEY, null)
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [queryClient])

  const status: AuthStatus = query.isLoading
    ? 'loading'
    : query.data
      ? 'authenticated'
      : 'anonymous'

  const value: AuthState = {
    status,
    ...(query.data ? { user: query.data as UsuarioDto & { role: Role } } : {}),
    refresh: async () => {
      await queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY })
    },
    signOut: () => {
      queryClient.setQueryData(ME_QUERY_KEY, null)
      queryClient.clear()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}
