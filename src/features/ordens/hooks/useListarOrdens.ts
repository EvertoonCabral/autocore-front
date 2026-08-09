import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError } from '@/api/errors'
import type { ListaOrdensServicoDto } from '@/api/types'
import type { StatusOrdem } from '@/shared/enums/statusOrdem'

export interface ListarOrdensParams {
  status?: StatusOrdem
  clienteId?: number
  abertaDe?: string
  abertaAte?: string
  /** Busca por número da OS, nome do cliente ou placa do veículo. */
  filtro?: string
  pagina: number
  porPagina: number
}

export const ordensKeys = {
  all: ['ordens'] as const,
  list: (params: ListarOrdensParams) => ['ordens', 'list', params] as const,
  detail: (id: number) => ['ordens', 'detail', id] as const,
  timeline: (id: number) => ['ordens', 'timeline', id] as const,
}

/**
 * Listagem de OS. A resposta é o `ListaOrdensServicoDto`: o envelope paginado
 * conhecido (`dados/total/pagina/porPagina`) + a soma do conjunto filtrado
 * inteiro (`somaTotalGeral`/`somaSaldoDevedor`), usada no rodapé da lista.
 */
export function useListarOrdens(params: ListarOrdensParams) {
  return useQuery({
    queryKey: ordensKeys.list(params),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const result = (await api.GET('/api/ordens', {
        params: {
          query: {
            pagina: params.pagina,
            porPagina: params.porPagina,
            ...(params.status ? { status: params.status } : {}),
            ...(params.clienteId ? { clienteId: params.clienteId } : {}),
            ...(params.abertaDe ? { abertaDe: params.abertaDe } : {}),
            ...(params.abertaAte ? { abertaAte: params.abertaAte } : {}),
            ...(params.filtro?.trim() ? { filtro: params.filtro.trim() } : {}),
          },
        },
      })) as {
        data?: ListaOrdensServicoDto
        error?: unknown
        response: Response
      }
      if (result.error || !result.data) throw toApiError(result.error, result.response.status)
      return result.data
    },
  })
}
