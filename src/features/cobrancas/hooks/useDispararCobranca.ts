import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError, type ApiError } from '@/api/errors'
import type { CobrancaJobResultado } from '@/api/types'
import { cobrancasKeys } from './useListarHistorico'

/**
 * `POST /api/cobrancas/disparar` — Admin only.
 *
 * Roda o mesmo `CobrancaJobService` que o agendador. A idempotência diária
 * do back garante que cada OS recebe no máximo 1 mensagem por dia, então
 * disparar manualmente após o job não cria duplicatas.
 */
export function useDispararCobranca() {
  const queryClient = useQueryClient()
  return useMutation<CobrancaJobResultado, ApiError, void>({
    mutationFn: async () => {
      const result = (await api.POST('/api/cobrancas/disparar')) as {
        data?: { dados?: CobrancaJobResultado | null }
        error?: unknown
        response: Response
      }
      if (result.error || !result.data) {
        throw toApiError(result.error, result.response.status)
      }
      return unwrap<CobrancaJobResultado>(result.data)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: cobrancasKeys.all })
    },
  })
}
