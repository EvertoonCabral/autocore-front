import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import { clientesKeys } from './useListarClientes'

export function useDesativarCliente() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      const { error, response } = await api.DELETE('/api/clientes/{id}', {
        params: { path: { id } },
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async (_data, id) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: clientesKeys.all }),
        queryClient.invalidateQueries({ queryKey: clientesKeys.detail(id) }),
      ])
    },
  })
}
