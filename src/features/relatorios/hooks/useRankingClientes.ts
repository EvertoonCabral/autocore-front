import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/api/client'
import { receber } from '@/api/envelope'
import type { RankingClientesDto } from '@/api/types'
import { relatoriosKeys } from './relatoriosKeys'

export interface RankingClientesParams {
  /** ISO date `yyyy-MM-dd`. Omitido → back usa hoje. */
  de?: string
  /** ISO date `yyyy-MM-dd`. Omitido → back usa hoje. */
  ate?: string
  pagina: number
  porPagina: number
}

/**
 * `GET /api/relatorios/clientes` — ranking de clientes por faturamento.
 *
 * ATENÇÃO: o back devolve um único objeto `RankingClientesDto` (não o
 * envelope paginado padrão) — a paginação (`total`, `pagina`, `porPagina`)
 * e os totais gerais vivem DENTRO de `dados`. Por isso usamos `receber`
 * (unwrap simples), não `receberPaginado`.
 * Autoriza Admin OU usuário com flag `podeVerRelatorios`.
 */
export function useRankingClientes(
  params: RankingClientesParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: relatoriosKeys.clientes(params as unknown as Record<string, unknown>),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const query: Record<string, string | number> = {
        pagina: params.pagina,
        porPagina: params.porPagina,
      }
      if (params.de) query.de = params.de
      if (params.ate) query.ate = params.ate

      const result = await api.GET('/api/relatorios/clientes', {
        params: { query },
      })
      return receber<RankingClientesDto>(result)
    },
  })
}
