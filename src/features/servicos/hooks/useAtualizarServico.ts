import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import type { ServicoFormValues } from '../helpers/servicoSchema'
import { servicosKeys } from './useListarServicos'

interface AtualizarServicoVars {
  id: number
  values: ServicoFormValues
}

export function useAtualizarServico() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, AtualizarServicoVars>({
    mutationFn: async ({ id, values }) => {
      const { error, response } = await api.PUT('/api/servicos/{id}', {
        params: { path: { id } },
        body: {
          id,
          nome: values.nome,
          descricao: values.descricao ?? null,
          preco: values.preco,
          ehMaoDeObraPadrao: values.ehMaoDeObraPadrao,
        },
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: servicosKeys.all })
    },
  })
}
