import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError } from '@/api/errors'
import type { components } from '@/api/schema'

export type ConfiguracaoCobrancaDto = components['schemas']['ConfiguracaoCobrancaDto']

export const cobrancaConfigKeys = {
  all: ['configuracao-cobranca'] as const,
  config: () => [...cobrancaConfigKeys.all, 'config'] as const,
  status: () => [...cobrancaConfigKeys.all, 'status'] as const,
}

/** `GET /api/configuracoes/cobranca` — Admin only. */
export function useObterConfiguracaoCobranca() {
  return useQuery({
    queryKey: cobrancaConfigKeys.config(),
    queryFn: async () => {
      const result = (await api.GET('/api/configuracoes/cobranca')) as {
        data?: { dados?: ConfiguracaoCobrancaDto | null }
        error?: unknown
        response: Response
      }
      if (result.error || !result.data) {
        throw toApiError(result.error, result.response.status)
      }
      return unwrap<ConfiguracaoCobrancaDto>(result.data)
    },
  })
}
