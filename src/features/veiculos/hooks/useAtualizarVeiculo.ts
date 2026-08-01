import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import type { VeiculoFormValues } from '../helpers/veiculoSchema'
import { veiculosKeys } from './useListarVeiculos'

interface AtualizarVeiculoVars {
  id: number
  values: VeiculoFormValues
}

export function useAtualizarVeiculo() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, AtualizarVeiculoVars>({
    mutationFn: async ({ id, values }) => {
      // O dono (clienteId) é imutável na edição — não vai no corpo.
      const { error, response } = await api.PUT('/api/veiculos/{id}', {
        params: { path: { id } },
        body: {
          id,
          placa: values.placa,
          marca: values.marca ?? null,
          modelo: values.modelo ?? null,
          anoFabricacao: values.anoFabricacao ?? null,
          anoModelo: values.anoModelo ?? null,
          cor: values.cor ?? null,
          chassi: values.chassi ?? null,
          renavam: values.renavam ?? null,
          observacoes: values.observacoes ?? null,
        },
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
