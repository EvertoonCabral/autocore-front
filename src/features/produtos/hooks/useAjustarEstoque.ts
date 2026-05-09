import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import { produtosKeys } from './useListarProdutos'

interface AjustarEstoqueVars {
  id: number
  quantidade: number
}

/**
 * `PATCH /api/produtos/{id}/estoque` — `quantidade` positiva entra no
 * estoque, negativa sai. O back rejeita ajustes que resultem em saldo < 0.
 */
export function useAjustarEstoque() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, AjustarEstoqueVars>({
    mutationFn: async ({ id, quantidade }) => {
      const { error, response } = await api.PATCH('/api/produtos/{id}/estoque', {
        params: { path: { id } },
        body: { quantidade },
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async (_data, { id }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: produtosKeys.all }),
        queryClient.invalidateQueries({ queryKey: produtosKeys.detail(id) }),
      ])
    },
  })
}
