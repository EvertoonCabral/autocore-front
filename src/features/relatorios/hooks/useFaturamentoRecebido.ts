import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/api/client'
import { receber } from '@/api/envelope'
import type { FaturamentoRecebidoDto } from '@/api/types'
import { relatoriosKeys } from './relatoriosKeys'

export interface FaturamentoRecebidoParams {
  /** ISO date `yyyy-MM-dd` — dia inicial (Brasil). Omitido → back usa hoje. */
  de?: string
  /** ISO date `yyyy-MM-dd` — dia final (Brasil). Omitido → back usa hoje. */
  ate?: string
  /** Enum FormaPagamento (1=Dinheiro,2=Pix,3=Cartao,4=Transferencia). */
  forma?: 1 | 2 | 3 | 4
}

/**
 * `GET /api/relatorios/faturamento-recebido` — total recebido no período,
 * série diária e distribuição por forma de pagamento.
 * Autoriza Admin OU usuário com flag `podeVerRelatorios`.
 */
export function useFaturamentoRecebido(
  params: FaturamentoRecebidoParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: relatoriosKeys.faturamento(params as unknown as Record<string, unknown>),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const query: Record<string, string | number> = {}
      if (params.de) query.de = params.de
      if (params.ate) query.ate = params.ate
      if (params.forma != null) query.forma = params.forma

      const result = await api.GET('/api/relatorios/faturamento-recebido', {
        params: { query },
      })
      return receber<FaturamentoRecebidoDto>(result)
    },
  })
}
