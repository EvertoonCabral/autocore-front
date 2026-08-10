import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError } from '@/api/errors'
import { cobrancaOnlineKeys, type SimulacaoCobrancaDto } from './useCobrancaOnlineKeys'

/**
 * `GET /api/cobranca-online/simular` — calcula base + acréscimo de taxa.
 * A fórmula de gross-up vive no back; o front só exibe o resultado.
 */
export function useSimularCobranca(
  ordemId: number,
  valor: number | undefined,
  tipo: 1 | 2 = 1,
  enabled = true,
) {
  return useQuery({
    queryKey: cobrancaOnlineKeys.simular(ordemId, valor, tipo),
    queryFn: async () => {
      const result = (await api.GET('/api/cobranca-online/simular', {
        params: { query: { ordemId, tipo, ...(valor != null ? { valor } : {}) } },
      })) as {
        data?: { dados?: SimulacaoCobrancaDto | null }
        error?: unknown
        response: Response
      }
      if (result.error || !result.data) throw toApiError(result.error, result.response.status)
      return unwrap<SimulacaoCobrancaDto>(result.data)
    },
    enabled: enabled && ordemId > 0,
  })
}
