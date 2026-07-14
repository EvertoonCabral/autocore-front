import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/api/client'
import { receberPaginado } from '@/api/envelope'
import type { HistoricoCobrancaDto } from '@/api/types'

export interface ListarHistoricoParams {
  ordemServicoId?: number
  somenteFalhas?: boolean
  pagina: number
  porPagina: number
}

export const cobrancasKeys = {
  all: ['cobrancas'] as const,
  historico: (params: ListarHistoricoParams) => ['cobrancas', 'historico', params] as const,
}

export function useListarHistoricoCobranca(params: ListarHistoricoParams) {
  return useQuery({
    queryKey: cobrancasKeys.historico(params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const query: Record<string, string | number | boolean> = {
        pagina: params.pagina,
        porPagina: params.porPagina,
      }
      if (params.ordemServicoId) query.ordemServicoId = params.ordemServicoId
      if (params.somenteFalhas) query.somenteFalhas = true

      const result = await api.GET('/api/cobrancas/historico', { params: { query } })
      return receberPaginado<HistoricoCobrancaDto>(result)
    },
  })
}
