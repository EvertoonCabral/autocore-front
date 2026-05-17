import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError } from '@/api/errors'
import type { components } from '@/api/schema'
import { cobrancaConfigKeys } from './useObterConfiguracaoCobranca'

export type StatusConexaoCobrancaDto = components['schemas']['StatusConexaoCobrancaDto']

/**
 * `GET /api/configuracoes/cobranca/status` — Admin only.
 *
 * Auto-refresh a cada 30s. Se a Evolution está lenta, `retry: 1` evita
 * bombardear o back com retries excessivos.
 */
export function useStatusConexaoCobranca() {
  return useQuery({
    queryKey: cobrancaConfigKeys.status(),
    queryFn: async () => {
      const result = (await api.GET('/api/configuracoes/cobranca/status')) as {
        data?: { dados?: StatusConexaoCobrancaDto | null }
        error?: unknown
        response: Response
      }
      if (result.error || !result.data) {
        throw toApiError(result.error, result.response.status)
      }
      return unwrap<StatusConexaoCobrancaDto>(result.data)
    },
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    retry: 1,
  })
}
