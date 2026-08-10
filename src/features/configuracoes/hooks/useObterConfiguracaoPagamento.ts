import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError } from '@/api/errors'
import type { components } from '@/api/schema'

export type ConfiguracaoPagamentoDto = components['schemas']['ConfiguracaoPagamentoDto']

export const pagamentoConfigKeys = {
  all: ['configuracao-pagamento'] as const,
  config: () => [...pagamentoConfigKeys.all, 'config'] as const,
  status: () => [...pagamentoConfigKeys.all, 'status'] as const,
}

/** `GET /api/configuracoes/pagamento` — Admin only. */
export function useObterConfiguracaoPagamento() {
  return useQuery({
    queryKey: pagamentoConfigKeys.config(),
    queryFn: async () => {
      const result = (await api.GET('/api/configuracoes/pagamento')) as {
        data?: { dados?: ConfiguracaoPagamentoDto | null }
        error?: unknown
        response: Response
      }
      if (result.error || !result.data) {
        throw toApiError(result.error, result.response.status)
      }
      return unwrap<ConfiguracaoPagamentoDto>(result.data)
    },
  })
}
