import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError } from '@/api/errors'
import { unwrap } from '@/api/envelope'
import type { UsuarioDto } from '@/api/types'

export const usuariosKeys = {
  all: ['auth', 'usuarios'] as const,
  list: ['auth', 'usuarios', 'list'] as const,
}

/** `GET /api/auth/usuarios` — Admin only. */
export function useListarUsuarios(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: usuariosKeys.list,
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const result = (await api.GET('/api/auth/usuarios')) as {
        data?: { dados?: UsuarioDto[] | null }
        error?: unknown
        response: Response
      }
      if (result.error || !result.data) {
        throw toApiError(result.error, result.response.status)
      }
      return unwrap<UsuarioDto[]>(result.data) ?? []
    },
  })
}
