import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import { ordensKeys } from '@/features/ordens/hooks/useListarOrdens'
import { pagamentosKeys } from './useListarPendencias'

interface EstornarVars {
  pagamentoId: number
  /** OrdemId passada explicitamente para invalidar caches específicas. */
  ordemId: number
}

/** `DELETE /api/pagamentos/{id}` — Admin only. */
export function useEstornarPagamento() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, EstornarVars>({
    mutationFn: async ({ pagamentoId }) => {
      const { error, response } = await api.DELETE('/api/pagamentos/{id}', {
        params: { path: { id: pagamentoId } },
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async (_data, { ordemId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: pagamentosKeys.all }),
        queryClient.invalidateQueries({ queryKey: pagamentosKeys.daOrdem(ordemId) }),
        queryClient.invalidateQueries({ queryKey: ordensKeys.detail(ordemId) }),
        queryClient.invalidateQueries({ queryKey: ordensKeys.all }),
      ])
    },
  })
}
