import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError } from '@/api/errors'
import type { MesFaturamentoDto } from '@/api/types'
import { dashboardKeys } from './useDashboardResumo'

/** `GET /api/dashboard/faturamento?meses={N}` — série mensal de receita. */
export function useFaturamentoMensal(meses: number) {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'faturamento', meses] as const,
    queryFn: async () => {
      const result = (await api.GET('/api/dashboard/faturamento', {
        params: { query: { meses } },
      })) as { data?: { dados?: MesFaturamentoDto[] }; error?: unknown; response: Response }
      if (result.error || !result.data) {
        throw toApiError(result.error, result.response.status)
      }
      return unwrap<MesFaturamentoDto[]>(result.data)
    },
    staleTime: 60_000,
  })
}
