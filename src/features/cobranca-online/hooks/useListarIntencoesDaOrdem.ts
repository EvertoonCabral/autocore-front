import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError } from '@/api/errors'
import { cobrancaOnlineKeys, type IntencaoPagamentoDto } from './useCobrancaOnlineKeys'

/** `GET /api/cobranca-online/ordem/{ordemId}` — intenções da OS (mais recentes primeiro). */
export function useListarIntencoesDaOrdem(ordemId: number) {
  return useQuery({
    queryKey: cobrancaOnlineKeys.daOrdem(ordemId),
    queryFn: async () => {
      const result = (await api.GET('/api/cobranca-online/ordem/{ordemId}', {
        params: { path: { ordemId } },
      })) as {
        data?: { dados?: IntencaoPagamentoDto[] | null }
        error?: unknown
        response: Response
      }
      if (result.error || !result.data) throw toApiError(result.error, result.response.status)
      return unwrap<IntencaoPagamentoDto[]>(result.data)
    },
    enabled: ordemId > 0,
  })
}
