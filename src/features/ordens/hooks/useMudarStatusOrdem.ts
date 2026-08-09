import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import type { ListaOrdensServicoDto } from '@/api/types'
import type { StatusOrdem } from '@/shared/enums/statusOrdem'
import { ordensKeys } from './useListarOrdens'

export interface MudarStatusVars {
  id: number
  status: StatusOrdem
}

interface Contexto {
  anteriores: Array<[readonly unknown[], ListaOrdensServicoDto]>
}

/**
 * Move a OS entre etapas não-terminais (arraste no quadro). Aplica update
 * otimista em todas as listas em cache e faz rollback se o PATCH falhar.
 */
export function useMudarStatusOrdem() {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, MudarStatusVars, Contexto>({
    mutationFn: async ({ id, status }) => {
      const { error, response } = await api.PATCH('/api/ordens/{id}/status', {
        params: { path: { id } },
        body: { status },
      })
      if (error) throw toApiError(error, response.status)
    },
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ordensKeys.all })

      // Snapshot de todas as listas de ordens em cache para rollback.
      const anteriores = queryClient.getQueriesData<ListaOrdensServicoDto>({
        queryKey: ordensKeys.all,
      })

      for (const [key, dados] of anteriores) {
        if (!dados) continue
        queryClient.setQueryData<ListaOrdensServicoDto>(key, {
          ...dados,
          dados: (dados.dados ?? []).map((o) => (o.id === id ? { ...o, status } : o)),
        })
      }

      return { anteriores: anteriores.filter((e): e is [readonly unknown[], ListaOrdensServicoDto] => e[1] != null) }
    },
    onError: (_err, _vars, ctx) => {
      // Rollback: restaura cada lista ao snapshot.
      ctx?.anteriores.forEach(([key, dados]) => queryClient.setQueryData(key, dados))
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: ordensKeys.all })
    },
  })
}
