import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError } from '@/api/errors'
import type { ClienteDto } from '@/api/types'
import { clientesKeys } from './useListarClientes'

export function useObterCliente(id: number | undefined) {
  return useQuery({
    queryKey: id ? clientesKeys.detail(id) : ['clientes', 'detail', 'none'],
    enabled: !!id,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/clientes/{id}', {
        params: { path: { id: id! } },
      })
      if (error || !data) throw toApiError(error, response.status)
      return unwrap<ClienteDto>(data)
    },
  })
}
