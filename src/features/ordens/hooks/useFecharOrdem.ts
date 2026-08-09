import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import { ordensKeys } from './useListarOrdens'

export interface FecharOrdemVars {
  id: number
  /** Override opcional de dias para vencimento; quando ausente, usa a config. */
  diasParaVencimento?: number
}

export function useFecharOrdem() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, FecharOrdemVars>({
    mutationFn: async ({ id, diasParaVencimento }) => {
      const { error, response } = await api.POST('/api/ordens/{id}/fechar', {
        params: { path: { id } },
        body: diasParaVencimento == null ? {} : { diasParaVencimento },
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async (_data, { id }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordensKeys.all }),
        queryClient.invalidateQueries({ queryKey: ordensKeys.detail(id) }),
      ])
    },
  })
}
