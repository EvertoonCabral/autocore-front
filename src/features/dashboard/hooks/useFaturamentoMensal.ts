import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { receber } from '@/api/envelope'
import type { MesFaturamentoDto } from '@/api/types'
import { dashboardKeys } from './useDashboardResumo'

/** `GET /api/dashboard/faturamento?meses={N}` — série mensal de receita. */
export function useFaturamentoMensal(meses: number) {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'faturamento', meses] as const,
    queryFn: async () => {
      const result = await api.GET('/api/dashboard/faturamento', {
        params: { query: { meses } },
      })
      return receber<MesFaturamentoDto[]>(result)
    },
    staleTime: 60_000,
  })
}
