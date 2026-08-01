import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/api/client'
import { receber } from '@/api/envelope'
import type { ResumoFinanceiroDto } from '@/api/types'
import { relatoriosKeys } from './relatoriosKeys'

export interface ResumoFinanceiroParams {
  /** ISO date `yyyy-MM-dd`. Omitido → back usa hoje. */
  de?: string
  /** ISO date `yyyy-MM-dd`. Omitido → back usa hoje. */
  ate?: string
}

/**
 * `GET /api/relatorios/resumo-financeiro` — recebido, faturado, a receber e
 * aging das pendências no período.
 * Autoriza Admin OU usuário com flag `podeVerRelatorios`.
 */
export function useResumoFinanceiro(
  params: ResumoFinanceiroParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: relatoriosKeys.resumo(params as unknown as Record<string, unknown>),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const query: Record<string, string> = {}
      if (params.de) query.de = params.de
      if (params.ate) query.ate = params.ate

      const result = await api.GET('/api/relatorios/resumo-financeiro', {
        params: { query },
      })
      return receber<ResumoFinanceiroDto>(result)
    },
  })
}
