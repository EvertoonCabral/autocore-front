import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/api/client'
import { receberPaginado } from '@/api/envelope'
import type { VeiculoResumoDto } from '@/api/types'

export interface ListarVeiculosParams {
  filtro?: string
  clienteId?: number
  pagina: number
  porPagina: number
  incluirInativos?: boolean
}

export const veiculosKeys = {
  all: ['veiculos'] as const,
  list: (params: ListarVeiculosParams) => ['veiculos', 'list', params] as const,
  detail: (id: number) => ['veiculos', 'detail', id] as const,
  doCliente: (clienteId: number) => ['veiculos', 'doCliente', clienteId] as const,
}

export function useListarVeiculos(params: ListarVeiculosParams) {
  return useQuery({
    queryKey: veiculosKeys.list(params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const result = await api.GET('/api/veiculos', {
        params: {
          query: {
            ...(params.filtro ? { filtro: params.filtro } : {}),
            ...(params.clienteId ? { clienteId: params.clienteId } : {}),
            pagina: params.pagina,
            porPagina: params.porPagina,
            incluirInativos: params.incluirInativos ?? false,
          },
        },
      })
      return receberPaginado<VeiculoResumoDto>(result)
    },
  })
}
