import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError, type ApiError } from '@/api/errors'
import type { ServicoFormValues } from '../helpers/servicoSchema'
import { servicosKeys } from './useListarServicos'

export function useCriarServico() {
  const queryClient = useQueryClient()
  return useMutation<{ id: number }, ApiError, ServicoFormValues>({
    mutationFn: async (form) => {
      const { data, error, response } = await api.POST('/api/servicos', {
        body: {
          nome: form.nome,
          descricao: form.descricao ?? null,
          preco: form.preco,
          ehMaoDeObraPadrao: form.ehMaoDeObraPadrao,
          garantiaDias: form.garantiaDias ?? null,
          tempoEstimadoMinutos: form.tempoEstimadoMinutos ?? null,
          categoria: form.categoria ?? null,
        },
      })
      if (error || !data) throw toApiError(error, response.status)
      const dados = unwrap<{ id?: number | null }>(data)
      return { id: Number(dados.id ?? 0) }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: servicosKeys.all })
    },
  })
}
