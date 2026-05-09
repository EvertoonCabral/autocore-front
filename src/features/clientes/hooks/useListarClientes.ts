import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError } from '@/api/errors'
import type { ApiPaginated, ClienteDto } from '@/api/types'

export interface ListarClientesParams {
  filtro?: string
  pagina: number
  porPagina: number
  incluirInativos?: boolean
}

export const clientesKeys = {
  all: ['clientes'] as const,
  list: (params: ListarClientesParams) => ['clientes', 'list', params] as const,
  detail: (id: number) => ['clientes', 'detail', id] as const,
  ordens: (id: number) => ['clientes', 'ordens', id] as const,
}

export function useListarClientes(params: ListarClientesParams) {
  return useQuery({
    queryKey: clientesKeys.list(params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const result = (await api.GET('/api/clientes', {
        params: {
          query: {
            ...(params.filtro ? { filtro: params.filtro } : {}),
            pagina: params.pagina,
            porPagina: params.porPagina,
            incluirInativos: params.incluirInativos ?? false,
          },
        },
      })) as {
        data?: ApiPaginated<ClienteDto>
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
