import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import { cobrancaOnlineKeys } from './useCobrancaOnlineKeys'

/** `DELETE /api/cobranca-online/{id}` — cancela uma intenção pendente. */
export function useCancelarIntencao(ordemId: number) {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, number>({
    mutationFn: async (id) => {
      const { error, response } = await api.DELETE('/api/cobranca-online/{id}', {
        params: { path: { id } },
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: cobrancaOnlineKeys.intencao(id) })
      void queryClient.invalidateQueries({ queryKey: cobrancaOnlineKeys.daOrdem(ordemId) })
    },
  })
}
