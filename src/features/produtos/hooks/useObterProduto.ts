import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError } from '@/api/errors'
import type { ProdutoDto } from '@/api/types'
import { produtosKeys } from './useListarProdutos'

export function useObterProduto(id: number | undefined) {
  return useQuery({
    queryKey: id ? produtosKeys.detail(id) : ['produtos', 'detail', 'none'],
    enabled: !!id,
    queryFn: async () => {
      const { data, error, response } = await api.GET('/api/produtos/{id}', {
        params: { path: { id: id! } },
      })
      if (error || !data) throw toApiError(error, response.status)
      return unwrap<ProdutoDto>(data)
    },
  })
}
