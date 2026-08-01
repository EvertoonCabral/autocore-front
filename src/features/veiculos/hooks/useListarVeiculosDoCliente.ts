import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { receber } from '@/api/envelope'
import type { VeiculoResumoDto } from '@/api/types'
import { veiculosKeys } from './useListarVeiculos'

/**
 * Veículos ATIVOS de um cliente (`GET /api/clientes/{id}/veiculos`).
 * Alimenta o `VeiculoSelect` do fluxo de OS. Desabilitado sem clienteId.
 */
export function useListarVeiculosDoCliente(clienteId: number | undefined) {
  return useQuery({
    queryKey: clienteId
      ? veiculosKeys.doCliente(clienteId)
      : ['veiculos', 'doCliente', 'none'],
    enabled: !!clienteId,
    queryFn: async () => {
      // Este endpoint só declara resposta 200 no contrato — o openapi-fetch
      // tipa `response` como `never` ao desestruturar, então usamos `receber`,
      // que centraliza o unwrap + tratamento de erro.
      const result = await api.GET('/api/clientes/{id}/veiculos', {
        params: { path: { id: clienteId! } },
      })
      return receber<VeiculoResumoDto[]>(result)
    },
  })
}
