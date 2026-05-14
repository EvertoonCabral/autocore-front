import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError } from '@/api/errors'
import type { ConfiguracaoDto } from '@/api/types'

export const configuracoesKeys = {
  all: ['configuracoes'] as const,
  list: ['configuracoes', 'list'] as const,
}

export function useListarConfiguracoes() {
  return useQuery({
    queryKey: configuracoesKeys.list,
    queryFn: async () => {
      const result = (await api.GET('/api/configuracoes')) as {
        data?: { dados?: ConfiguracaoDto[] | null }
        error?: unknown
        response: Response
      }
      if (result.error || !result.data) {
        throw toApiError(result.error, result.response.status)
      }
      return unwrap<ConfiguracaoDto[]>(result.data)
    },
  })
}
