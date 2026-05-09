import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError } from '@/api/errors'
import type { CatalogoServicoDto } from '@/api/types'

export const servicosKeys = {
  all: ['servicos'] as const,
  list: (incluirInativos: boolean) => ['servicos', 'list', { incluirInativos }] as const,
}

export function useListarServicos(incluirInativos = false) {
  return useQuery({
    queryKey: servicosKeys.list(incluirInativos),
    queryFn: async () => {
      const result = (await api.GET('/api/servicos', {
        params: { query: { incluirInativos } },
      })) as {
        data?: { dados?: CatalogoServicoDto[] | null }
        error?: unknown
        response: Response
      }
      if (result.error || !result.data) {
        throw toApiError(result.error, result.response.status)
      }
      return unwrap<CatalogoServicoDto[]>(result.data)
    },
  })
}
