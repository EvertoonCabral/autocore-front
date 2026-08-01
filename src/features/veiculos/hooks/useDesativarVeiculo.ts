import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import { veiculosKeys } from './useListarVeiculos'

interface DesativarVeiculoVars {
  id: number
  /** Motivo da desativação — obrigatório no back. */
  motivo: string
}

export function useDesativarVeiculo() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, DesativarVeiculoVars>({
    mutationFn: async ({ id, motivo }) => {
      const { error, response } = await api.POST('/api/veiculos/{id}/desativar', {
        params: { path: { id } },
        body: { motivo },
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async (_data, { id }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: veiculosKeys.all }),
        queryClient.invalidateQueries({ queryKey: veiculosKeys.detail(id) }),
      ])
    },
  })
}
