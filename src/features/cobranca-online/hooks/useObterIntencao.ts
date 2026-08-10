import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError } from '@/api/errors'
import { statusIntencaoTerminal } from '@/shared/enums/statusIntencaoPagamento'
import { cobrancaOnlineKeys, type IntencaoPagamentoDto } from './useCobrancaOnlineKeys'

/**
 * `GET /api/cobranca-online/{id}` — consulta a intenção. O back sincroniza com
 * o gateway a cada leitura enquanto pendente, então o polling reflete o
 * pagamento (e, em stub, aprova após alguns segundos). O `refetchInterval` para
 * sozinho quando o status vira terminal.
 */
export function useObterIntencao(id: number | null, intervaloMs = 3000) {
  return useQuery({
    queryKey: cobrancaOnlineKeys.intencao(id ?? 0),
    queryFn: async () => {
      const result = (await api.GET('/api/cobranca-online/{id}', {
        params: { path: { id: id as number } },
      })) as {
        data?: { dados?: IntencaoPagamentoDto | null }
        error?: unknown
        response: Response
      }
      if (result.error || !result.data) throw toApiError(result.error, result.response.status)
      return unwrap<IntencaoPagamentoDto>(result.data)
    },
    enabled: id != null && id > 0,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return statusIntencaoTerminal(status) ? false : intervaloMs
    },
    refetchOnWindowFocus: true,
  })
}
