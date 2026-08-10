import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError } from '@/api/errors'
import type { components } from '@/api/schema'
import { pagamentoConfigKeys } from './useObterConfiguracaoPagamento'

export type StatusPagamentoDto = components['schemas']['StatusPagamentoDto']

/**
 * `GET /api/configuracoes/pagamento/status` — Admin only.
 *
 * Testa as credenciais do Mercado Pago (GET /users/me). Sem auto-refresh:
 * é uma verificação sob demanda (botão "Testar credenciais"). `retry: 1`
 * evita bombardear a API do MP se estiver lenta.
 */
export function useStatusPagamento() {
  return useQuery({
    queryKey: pagamentoConfigKeys.status(),
    queryFn: async () => {
      const result = (await api.GET('/api/configuracoes/pagamento/status')) as {
        data?: { dados?: StatusPagamentoDto | null }
        error?: unknown
        response: Response
      }
      if (result.error || !result.data) {
        throw toApiError(result.error, result.response.status)
      }
      return unwrap<StatusPagamentoDto>(result.data)
    },
    enabled: false, // sob demanda — dispara via refetch() no botão
    retry: 1,
  })
}
