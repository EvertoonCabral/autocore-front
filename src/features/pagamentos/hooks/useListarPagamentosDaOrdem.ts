import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError } from '@/api/errors'
import type { PagamentoDto } from '@/api/types'
import { pagamentosKeys } from './useListarPendencias'

export function useListarPagamentosDaOrdem(ordemId: number | undefined) {
  return useQuery({
    queryKey: ordemId
      ? pagamentosKeys.daOrdem(ordemId)
      : ['pagamentos', 'ordem', 'none'],
    enabled: !!ordemId,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/pagamentos/ordem/{ordemId}', {
        params: { path: { ordemId: ordemId! } },
      })
      if (error || !data) throw toApiError(error, response.status)
      return unwrap<PagamentoDto[]>(data)
    },
  })
}
