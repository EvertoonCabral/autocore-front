import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import { ordensKeys } from './useListarOrdens'

export function useFecharOrdem() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      const { error, response } = await api.POST('/api/ordens/{id}/fechar', {
        params: { path: { id } },
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordensKeys.all }),
        queryClient.invalidateQueries({ queryKey: ordensKeys.detail(id) }),
      ])
    },
  })
}
