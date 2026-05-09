import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError } from '@/api/errors'
import type { ProdutoDto } from '@/api/types'
import { produtosKeys } from './useListarProdutos'

export function useListarProdutosAbaixoMinimo() {
  return useQuery({
    queryKey: produtosKeys.abaixoMinimo,
    queryFn: async () => {
      const result = (await api.GET('/api/produtos/abaixo-minimo')) as {
        data?: { dados?: ProdutoDto[] | null }
        error?: unknown
        response: Response
      }
      if (result.error || !result.data) {
        throw toApiError(result.error, result.response.status)
      }
      return unwrap<ProdutoDto[]>(result.data)
    },
  })
}
