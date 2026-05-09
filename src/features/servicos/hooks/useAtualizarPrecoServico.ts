import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import { servicosKeys } from './useListarServicos'

interface AtualizarPrecoVars {
  id: number
  preco: number
}

/**
 * `PATCH /api/servicos/{id}/preco` — restrito a Admin no back. UI também
 * deve gatear o botão com `<Can permission="servicos.atualizarPreco">`.
 */
export function useAtualizarPrecoServico() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, AtualizarPrecoVars>({
    mutationFn: async ({ id, preco }) => {
      const { error, response } = await api.PATCH('/api/servicos/{id}/preco', {
        params: { path: { id } },
        body: { preco },
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: servicosKeys.all })
    },
  })
}
