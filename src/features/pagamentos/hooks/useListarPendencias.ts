import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError } from '@/api/errors'
import type { ApiPaginated, OrdemPendenteDto } from '@/api/types'

export interface ListarPendenciasParams {
  somenteVencidas?: boolean
  pagina: number
  porPagina: number
}

export const pagamentosKeys = {
  all: ['pagamentos'] as const,
  pendencias: (params: ListarPendenciasParams) => ['pagamentos', 'pendencias', params] as const,
  daOrdem: (ordemId: number) => ['pagamentos', 'ordem', ordemId] as const,
}

export function useListarPendencias(params: ListarPendenciasParams) {
  return useQuery({
    queryKey: pagamentosKeys.pendencias(params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const query: Record<string, string | number | boolean> = {
        pagina: params.pagina,
        porPagina: params.porPagina,
      }
      if (params.somenteVencidas) query.somenteVencidas = true

      const result = (await api.GET('/api/pagamentos/pendencias', {
        params: { query },
      })) as {
        data?: ApiPaginated<OrdemPendenteDto>
        error?: unknown
        response: Response
      }
      if (result.error || !result.data) {
        throw toApiError(result.error, result.response.status)
      }
      return result.data
    },
  })
}
