import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import type { AdicionarItemProdutoFormValues } from '../helpers/ordemSchemas'
import { ordensKeys } from './useListarOrdens'

interface AdicionarProdutoVars {
  ordemId: number
  values: AdicionarItemProdutoFormValues
}

export function useAdicionarItemProduto() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, AdicionarProdutoVars>({
    mutationFn: async ({ ordemId, values }) => {
      const { error, response } = await api.POST('/api/ordens/{id}/produtos', {
        params: { path: { id: ordemId } },
        body: {
          produtoId: values.produtoId ?? null,
          nomeProduto: values.nomeProduto ?? null,
          precoUnitario: values.precoUnitario ?? null,
          quantidade: values.quantidade,
          produtoFornecidoPeloCliente: values.produtoFornecidoPeloCliente,
        },
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ordensKeys.all })
    },
  })
}

interface RemoverProdutoVars {
  ordemId: number
  itemId: number
}

export function useRemoverItemProduto() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, RemoverProdutoVars>({
    mutationFn: async ({ ordemId, itemId }) => {
      const { error, response } = await api.DELETE('/api/ordens/{id}/produtos/{itemId}', {
        params: { path: { id: ordemId, itemId } },
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ordensKeys.all })
    },
  })
}
