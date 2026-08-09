import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError } from '@/api/errors'
import type { ResumoClienteDto } from '@/api/types'

/**
 * Resumo do cliente (saldo em aberto, nº de OS abertas, últimas OS) para o
 * painel de contexto da Nova OS. Só dispara quando há `id`.
 */
export function useResumoCliente(id: number | undefined) {
  return useQuery({
    queryKey: id ? (['clientes', 'resumo', id] as const) : (['clientes', 'resumo', 'none'] as const),
    enabled: !!id,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/clientes/{id}/resumo', {
        params: { path: { id: id! } },
      })
      if (error || !data) throw toApiError(error, response.status)
      return unwrap<ResumoClienteDto>(data)
    },
  })
}
