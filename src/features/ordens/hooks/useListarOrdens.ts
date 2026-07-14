import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/api/client'
import { receberPaginado } from '@/api/envelope'
import type { OrdemServicoResumoDto } from '@/api/types'
import type { StatusOrdem } from '@/shared/enums/statusOrdem'

export interface ListarOrdensParams {
  status?: StatusOrdem
  clienteId?: number
  abertaDe?: string
  abertaAte?: string
  pagina: number
  porPagina: number
}

export const ordensKeys = {
  all: ['ordens'] as const,
  list: (params: ListarOrdensParams) => ['ordens', 'list', params] as const,
  detail: (id: number) => ['ordens', 'detail', id] as const,
  timeline: (id: number) => ['ordens', 'timeline', id] as const,
}

export function useListarOrdens(params: ListarOrdensParams) {
  return useQuery({
    queryKey: ordensKeys.list(params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const query: Record<string, string | number | boolean> = {
        pagina: params.pagina,
        porPagina: params.porPagina,
      }
      if (params.status) query.status = params.status
      if (params.clienteId) query.clienteId = params.clienteId
      if (params.abertaDe) query.abertaDe = params.abertaDe
      if (params.abertaAte) query.abertaAte = params.abertaAte

      const result = await api.GET('/api/ordens', { params: { query } })
      return receberPaginado<OrdemServicoResumoDto>(result)
    },
  })
}
