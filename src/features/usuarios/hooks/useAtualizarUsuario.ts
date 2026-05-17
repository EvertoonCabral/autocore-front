import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import { usuariosKeys } from '@/shared/hooks/useListarUsuarios'

export interface AtualizarUsuarioBody {
  nomeCompleto: string
  ativo: boolean
  /** Omitir = não altera senha. */
  novaSenha?: string
}

export interface AtualizarUsuarioVars {
  id: number
  body: AtualizarUsuarioBody
}

/** `PUT /api/auth/usuarios/{id}` — Admin only. */
export function useAtualizarUsuario() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, AtualizarUsuarioVars>({
    mutationFn: async ({ id, body }) => {
      const { error, response } = await api.PUT('/api/auth/usuarios/{id}', {
        params: { path: { id } },
        body: {
          nomeCompleto: body.nomeCompleto,
          ativo: body.ativo,
          ...(body.novaSenha !== undefined ? { novaSenha: body.novaSenha } : {}),
        },
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usuariosKeys.all })
    },
  })
}
