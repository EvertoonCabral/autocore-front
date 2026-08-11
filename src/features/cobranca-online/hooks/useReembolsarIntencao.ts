import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import { cobrancaOnlineKeys } from './useCobrancaOnlineKeys'

export interface ReembolsarVars {
  id: number
  /** Valor parcial; omitido = reembolso total. */
  valor?: number | undefined
}

/** `POST /api/cobranca-online/{id}/reembolso` — Admin. */
export function useReembolsarIntencao(ordemId: number) {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, ReembolsarVars>({
    mutationFn: async ({ id, valor }) => {
      const { error, response } = await api.POST('/api/cobranca-online/{id}/reembolso', {
        params: { path: { id } },
        body: { valor: valor ?? null },
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: cobrancaOnlineKeys.intencao(id) })
      void queryClient.invalidateQueries({ queryKey: cobrancaOnlineKeys.daOrdem(ordemId) })
      void queryClient.invalidateQueries({ queryKey: ['ordens', 'detail', ordemId] })
      void queryClient.invalidateQueries({ queryKey: ['pagamentos', 'ordem', ordemId] })
    },
  })
}
