import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError } from '@/api/errors'
import type { OrdemServicoDetalheDto } from '@/api/types'
import { ordensKeys } from './useListarOrdens'

export function useObterOrdem(id: number | undefined) {
  return useQuery({
    queryKey: id ? ordensKeys.detail(id) : ['ordens', 'detail', 'none'],
    enabled: !!id,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/ordens/{id}', {
        params: { path: { id: id! } },
      })
      if (error || !data) throw toApiError(error, response.status)
      return unwrap<OrdemServicoDetalheDto>(data)
    },
  })
}
