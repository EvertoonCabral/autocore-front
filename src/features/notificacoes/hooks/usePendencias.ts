import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError } from '@/api/errors'

export interface ContagensPendencias {
  pendenciasVencidas: number
  ossAguardandoProdutoHa7Dias: number
}

/**
 * Conta pendências para o sino do header. Refetch a cada 5 minutos com
 * staleTime de 60s para não martelar o back. `enabled` controla pela rota
 * (não polla se o usuário não está autenticado — caller cuida).
 *
 * Passa pelo cliente tipado `api` (openapi-fetch): além da type-safety do
 * contrato, um 401 no polling em background dispara o UNAUTHORIZED_EVENT e
 * derruba a sessão — antes, com `fetch` cru, uma sessão expirada ficava
 * "zumbi" até uma chamada tipada acontecer.
 */
export function usePendencias(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['dashboard', 'pendencias'],
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
    queryFn: async (): Promise<ContagensPendencias> => {
      const { data, error, response } = await api.GET('/api/dashboard/pendencias')
      if (error || !data?.dados) throw toApiError(error, response.status)
      return {
        pendenciasVencidas: data.dados.pendenciasVencidas ?? 0,
        ossAguardandoProdutoHa7Dias: data.dados.ossAguardandoProdutoHa7Dias ?? 0,
      }
    },
  })
}
