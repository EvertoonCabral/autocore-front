import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError, type ApiError } from '@/api/errors'
import { usuariosKeys } from '@/shared/hooks/useListarUsuarios'
import type { NovoUsuarioFormValues } from '../helpers/usuarioSchemas'

export interface NovoUsuarioResultado {
  id: number
}

/** `POST /api/auth/usuarios` — Admin only. */
export function useCriarUsuario() {
  const queryClient = useQueryClient()
  return useMutation<NovoUsuarioResultado, ApiError, NovoUsuarioFormValues>({
    mutationFn: async (form) => {
      const { data, error, response } = await api.POST('/api/auth/usuarios', {
        body: {
          nomeCompleto: form.nomeCompleto,
          email: form.email,
          senha: form.senha,
          role: form.role,
        },
      })
      if (error || !data) throw toApiError(error, response.status)
      const dados = unwrap<{ id?: number | null }>(data)
      return { id: Number(dados.id ?? 0) }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usuariosKeys.all })
    },
  })
}
