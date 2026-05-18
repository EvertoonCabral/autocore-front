import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError } from '@/api/errors'
import type { ApiEnvelope, DashboardResumoDto } from '@/api/types'

export const dashboardKeys = {
  all: ['dashboard'] as const,
  resumo: () => [...dashboardKeys.all, 'resumo'] as const,
}

/** `GET /api/dashboard/resumo` — panorama agregado da oficina. */
export function useDashboardResumo() {
  return useQuery({
    queryKey: dashboardKeys.resumo(),
    queryFn: async () => {
      const result = (await api.GET('/api/dashboard/resumo')) as {
        data?: ApiEnvelope<DashboardResumoDto>
        error?: unknown
        response: Response
      }
      if (result.error || !result.data) {
        throw toApiError(result.error, result.response.status)
      }
      return unwrap<DashboardResumoDto>(result.data)
    },
    staleTime: 60_000,
  })
}
