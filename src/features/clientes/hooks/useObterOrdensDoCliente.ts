import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError } from '@/api/errors'
import type { OrdemServicoResumoDto } from '@/api/types'
import { clientesKeys } from './useListarClientes'

export function useObterOrdensDoCliente(id: number | undefined) {
  return useQuery({
    queryKey: id ? clientesKeys.ordens(id) : ['clientes', 'ordens', 'none'],
    enabled: !!id,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/clientes/{id}/ordens', {
        params: { path: { id: id! } },
      })
      if (error || !data) throw toApiError(error, response.status)
      return unwrap<OrdemServicoResumoDto[]>(data)
    },
  })
}
