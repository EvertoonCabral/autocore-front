import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError, type ApiError } from '@/api/errors'
import type { CobrancaIndividualResultado } from '@/api/types'
import { cobrancasKeys } from './useListarHistorico'
import { pagamentosKeys } from '@/features/pagamentos/hooks/useListarPendencias'

/**
 * `POST /api/cobrancas/disparar/{ordemServicoId}` — cobrança individual proativa.
 *
 * Aberta a Operador e Admin (não exige `<Can>`). O back valida:
 * - OS está Concluída
 * - Saldo devedor > 0
 * - Cliente ativo
 * - Idempotência diária (1 envio com sucesso por OS por dia)
 *
 * O resultado discrimina o status: Enviada, Falha, JaEnviadaHoje, OsInvalida.
 */
export function useCobrarOrdem() {
  const queryClient = useQueryClient()
  return useMutation<CobrancaIndividualResultado, ApiError, number>({
    mutationFn: async (ordemServicoId) => {
      const result = (await api.POST('/api/cobrancas/disparar/{ordemServicoId}', {
        params: { path: { ordemServicoId } },
      })) as {
        data?: { dados?: CobrancaIndividualResultado | null }
        error?: unknown
        response: Response
      }
      if (result.error || !result.data) {
        throw toApiError(result.error, result.response.status)
      }
      return unwrap<CobrancaIndividualResultado>(result.data)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: cobrancasKeys.all }),
        queryClient.invalidateQueries({ queryKey: pagamentosKeys.all }),
      ])
    },
  })
}
