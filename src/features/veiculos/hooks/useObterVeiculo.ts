import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError } from '@/api/errors'
import type { VeiculoDetalheDto } from '@/api/types'
import { veiculosKeys } from './useListarVeiculos'

export function useObterVeiculo(id: number | undefined) {
  return useQuery({
    queryKey: id ? veiculosKeys.detail(id) : ['veiculos', 'detail', 'none'],
    enabled: !!id,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/veiculos/{id}', {
        params: { path: { id: id! } },
      })
      if (error || !data) throw toApiError(error, response.status)
      return unwrap<VeiculoDetalheDto>(data)
    },
  })
}
