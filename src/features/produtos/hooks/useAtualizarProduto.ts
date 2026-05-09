import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import type { ProdutoFormValues } from '../helpers/produtoSchema'
import { produtosKeys } from './useListarProdutos'

interface AtualizarProdutoVars {
  id: number
  values: ProdutoFormValues
}

export function useAtualizarProduto() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, AtualizarProdutoVars>({
    mutationFn: async ({ id, values }) => {
      const { error, response } = await api.PUT('/api/produtos/{id}', {
        params: { path: { id } },
        body: {
          id,
          nome: values.nome,
          referencia: values.referencia ?? null,
          precoCusto: values.precoCusto,
          precoVenda: values.precoVenda,
          quantidadeEstoque: values.quantidadeEstoque,
          estoqueMinimo: values.estoqueMinimo,
        },
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async (_data, { id }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: produtosKeys.all }),
        queryClient.invalidateQueries({ queryKey: produtosKeys.detail(id) }),
      ])
    },
  })
}
