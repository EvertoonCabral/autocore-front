import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import type { components } from '@/api/schema'
import { pagamentoConfigKeys } from './useObterConfiguracaoPagamento'

export type AtualizarConfiguracaoPagamentoDto =
  components['schemas']['AtualizarConfiguracaoPagamentoDto']

/**
 * `PUT /api/configuracoes/pagamento` — Admin only.
 *
 * Convenção: `accessToken`/`webhookSecret` omitidos ou vazios mantêm o segredo
 * atual no back. Para substituir, envie o novo valor.
 */
export function useAtualizarConfiguracaoPagamento() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, AtualizarConfiguracaoPagamentoDto>({
    mutationFn: async (body) => {
      const { error, response } = await api.PUT('/api/configuracoes/pagamento', {
        body,
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: pagamentoConfigKeys.config() }),
        queryClient.invalidateQueries({ queryKey: pagamentoConfigKeys.status() }),
      ])
    },
  })
}
