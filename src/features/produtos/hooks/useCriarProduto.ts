import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError, type ApiError } from '@/api/errors'
import type { ProdutoFormValues } from '../helpers/produtoSchema'
import { produtosKeys } from './useListarProdutos'

export function useCriarProduto() {
  const queryClient = useQueryClient()
  return useMutation<{ id: number }, ApiError, ProdutoFormValues>({
    mutationFn: async (form) => {
      const { data, error, response } = await api.POST('/api/produtos', {
        body: {
          nome: form.nome,
          referencia: form.referencia ?? null,
          precoCusto: form.precoCusto,
          precoVenda: form.precoVenda,
          quantidadeEstoque: form.quantidadeEstoque,
          estoqueMinimo: form.estoqueMinimo,
        },
      })
      if (error || !data) throw toApiError(error, response.status)
      const dados = unwrap<{ id?: number | null }>(data)
      return { id: Number(dados.id ?? 0) }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: produtosKeys.all })
    },
  })
}
