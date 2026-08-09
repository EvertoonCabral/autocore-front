import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import type { AtualizarOrdemFormValues } from '../helpers/ordemSchemas'
import { ordensKeys } from './useListarOrdens'

interface AtualizarOrdemVars {
  id: number
  values: AtualizarOrdemFormValues
}

export function useAtualizarOrdem() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, AtualizarOrdemVars>({
    mutationFn: async ({ id, values }) => {
      const { error, response } = await api.PUT('/api/ordens/{id}', {
        params: { path: { id } },
        body: {
          id,
          veiculoId: values.veiculoId ?? null,
          quilometragemEntrada: values.quilometragemEntrada ?? null,
          descricaoProblema: values.descricaoProblema ?? null,
          observacoes: values.observacoes ?? null,
          status: values.status,
          dataAgendamentoInicio:
            values.agendada && values.dataAgendamentoInicio
              ? new Date(values.dataAgendamentoInicio).toISOString()
              : null,
        },
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async (_data, { id }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ordensKeys.all }),
        queryClient.invalidateQueries({ queryKey: ordensKeys.detail(id) }),
      ])
    },
  })
}
