import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/api/client'
import { receberPaginado } from '@/api/envelope'
import type { ProdutoDto } from '@/api/types'

export interface ListarProdutosParams {
  filtro?: string
  pagina: number
  porPagina: number
  incluirInativos?: boolean
}

export const produtosKeys = {
  all: ['produtos'] as const,
  list: (params: ListarProdutosParams) => ['produtos', 'list', params] as const,
  detail: (id: number) => ['produtos', 'detail', id] as const,
  abaixoMinimo: ['produtos', 'abaixo-minimo'] as const,
}

export function useListarProdutos(params: ListarProdutosParams) {
  return useQuery({
    queryKey: produtosKeys.list(params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const result = await api.GET('/api/produtos', {
        params: {
          query: {
            ...(params.filtro ? { filtro: params.filtro } : {}),
            pagina: params.pagina,
            porPagina: params.porPagina,
            incluirInativos: params.incluirInativos ?? false,
          },
        },
      })
      return receberPaginado<ProdutoDto>(result)
    },
  })
}
