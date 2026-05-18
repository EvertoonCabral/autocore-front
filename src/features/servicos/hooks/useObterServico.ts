import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError } from '@/api/errors'
import type { CatalogoServicoDto } from '@/api/types'
import { servicosKeys } from './useListarServicos'

/**
 * Obtém um serviço pelo ID via `GET /api/servicos/{id}`. Endpoint dedicado
 * do back retorna o DTO completo (com auditoria) e 404 se não existir.
 */
export function useObterServico(id: number | undefined) {
  return useQuery({
    queryKey: id ? servicosKeys.detail(id) : ['servicos', 'detail', 'none'],
    enabled: !!id,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/servicos/{id}', {
        params: { path: { id: id! } },
      })
      if (error || !data) throw toApiError(error, response.status)
      return unwrap<CatalogoServicoDto>(data)
    },
  })
}
