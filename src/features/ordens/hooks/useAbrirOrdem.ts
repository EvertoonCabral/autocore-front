import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError, type ApiError } from '@/api/errors'
import type { AbrirOrdemFormValues } from '../helpers/ordemSchemas'
import { ordensKeys } from './useListarOrdens'

export function useAbrirOrdem() {
  const queryClient = useQueryClient()
  return useMutation<{ id: number }, ApiError, AbrirOrdemFormValues>({
    mutationFn: async (form) => {
      const { data, error, response } = await api.POST('/api/ordens', {
        body: {
          clienteId: form.clienteId,
          veiculoId: form.veiculoId ?? null,
          quilometragemEntrada: form.quilometragemEntrada ?? null,
          descricaoProblema: form.descricaoProblema ?? null,
          observacoes: form.observacoes ?? null,
        },
      })
      if (error || !data) throw toApiError(error, response.status)
      const dados = unwrap<{ id?: number | null }>(data)
      return { id: Number(dados.id ?? 0) }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ordensKeys.all })
    },
  })
}
