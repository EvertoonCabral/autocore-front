import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import type { UsuarioDto } from '@/api/types'
import { usuariosKeys } from '@/shared/hooks/useListarUsuarios'

export interface AtualizarPermissaoRelatoriosVars {
  usuarioId: number
  podeVerRelatorios: boolean
}

interface OptimisticCtx {
  previous: UsuarioDto[] | undefined
}

/**
 * `PUT /api/auth/usuarios/{id}/permissao-relatorios` — Admin only.
 * Aplica toggle otimista no cache de `usuariosKeys.list` e faz rollback em erro.
 * Espelha `useAtualizarPermissaoAuditoria`.
 */
export function useAtualizarPermissaoRelatorios() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, AtualizarPermissaoRelatoriosVars, OptimisticCtx>({
    mutationFn: async ({ usuarioId, podeVerRelatorios }) => {
      const { error, response } = await api.PUT(
        '/api/auth/usuarios/{id}/permissao-relatorios',
        {
          params: { path: { id: usuarioId } },
          body: { podeVerRelatorios },
        },
      )
      if (error) throw toApiError(error, response.status)
    },
    onMutate: async ({ usuarioId, podeVerRelatorios }) => {
      await queryClient.cancelQueries({ queryKey: usuariosKeys.list })
      const previous = queryClient.getQueryData<UsuarioDto[]>(usuariosKeys.list)
      if (previous) {
        queryClient.setQueryData<UsuarioDto[]>(
          usuariosKeys.list,
          previous.map((u) =>
            u.id === usuarioId ? { ...u, podeVerRelatorios } : u,
          ),
        )
      }
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) {
        queryClient.setQueryData(usuariosKeys.list, ctx.previous)
      }
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: usuariosKeys.all })
    },
  })
}
