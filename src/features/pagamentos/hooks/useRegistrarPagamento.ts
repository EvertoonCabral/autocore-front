import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError, type ApiError } from '@/api/errors'
import { ordensKeys } from '@/features/ordens/hooks/useListarOrdens'
import type { FormaPagamento } from '@/shared/enums/formaPagamento'
import type { PagamentoFormValues } from '../helpers/pagamentoSchema'
import { pagamentosKeys } from './useListarPendencias'

interface RegistrarVars {
  ordemId: number
  values: PagamentoFormValues
}

export function useRegistrarPagamento() {
  const queryClient = useQueryClient()
  return useMutation<{ id: number }, ApiError, RegistrarVars>({
    mutationFn: async ({ ordemId, values }) => {
      const { data, error, response } = await api.POST('/api/pagamentos', {
        body: {
          ordemServicoId: ordemId,
          valor: values.valor,
          forma: values.forma as FormaPagamento,
          observacao: values.observacao ?? null,
        },
      })
      if (error || !data) throw toApiError(error, response.status)
      const dados = unwrap<{ id?: number | null }>(data)
      return { id: Number(dados.id ?? 0) }
    },
    onSuccess: async (_data, { ordemId }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: pagamentosKeys.all }),
        queryClient.invalidateQueries({ queryKey: pagamentosKeys.daOrdem(ordemId) }),
        // O detalhe da OS recalcula totais e saldo devedor
        queryClient.invalidateQueries({ queryKey: ordensKeys.detail(ordemId) }),
        queryClient.invalidateQueries({ queryKey: ordensKeys.all }),
      ])
    },
  })
}
