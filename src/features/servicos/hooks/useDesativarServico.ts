import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import { servicosKeys } from './useListarServicos'

/** `DELETE /api/servicos/{id}` — Admin only. */
export function useDesativarServico() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      const { error, response } = await api.DELETE('/api/servicos/{id}', {
        params: { path: { id } },
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: servicosKeys.all })
    },
  })
}
