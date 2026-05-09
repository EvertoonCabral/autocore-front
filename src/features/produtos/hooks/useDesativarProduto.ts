import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import { produtosKeys } from './useListarProdutos'

/** `DELETE /api/produtos/{id}` — Admin only. */
export function useDesativarProduto() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      const { error, response } = await api.DELETE('/api/produtos/{id}', {
        params: { path: { id } },
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: produtosKeys.all }),
        queryClient.invalidateQueries({ queryKey: produtosKeys.detail(id) }),
      ])
    },
  })
}
