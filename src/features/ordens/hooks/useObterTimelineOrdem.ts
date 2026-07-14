import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError } from '@/api/errors'
import { ordensKeys } from './useListarOrdens'

// Mesma numeração do enum `TipoEntradaTimelineOrdem` no back.
export const TIPO_OPERACAO = 1
export const TIPO_PAGAMENTO = 2
export const TIPO_ITEM_SERVICO = 3
export const TIPO_ITEM_PRODUTO = 4
export const TIPO_COBRANCA = 5

export type TipoEntradaTimelineOrdem = 1 | 2 | 3 | 4 | 5

// Mesma numeração de `FormaPagamento` no back.
export type FormaPagamentoCod = 1 | 2 | 3 | 4

export interface TimelineEntradaOrdem {
  tipo: TipoEntradaTimelineOrdem
  ocorridoEm: string
  titulo: string
  descricao: string | null
  usuarioId: number | null
  usuarioNome: string | null
  valor: number | null
  formaPagamento: FormaPagamentoCod | null
  cobrancaSucesso: boolean | null
}

/**
 * Carrega a timeline rica de uma OS. Endpoint agregador no back junta
 * auditoria + pagamentos + itens + cobranças num único array ordenado
 * desc por data. Sem paginação — volume baixo por OS.
 *
 * Via cliente tipado `api` (openapi-fetch): um 401 aqui passa a disparar o
 * UNAUTHORIZED_EVENT (antes o `fetch` cru furava o handler global). O DTO
 * gerado é todo opcional, então mapeamos para a forma local não-opcional.
 */
export function useObterTimelineOrdem(ordemId: number | undefined) {
  return useQuery({
    queryKey: ordensKeys.timeline(ordemId ?? 0),
    enabled: !!ordemId && ordemId > 0,
    queryFn: async (): Promise<TimelineEntradaOrdem[]> => {
      const { data, error, response } = await api.GET('/api/ordens/{id}/timeline', {
        params: { path: { id: ordemId as number } },
      })
      if (error || !data?.dados) throw toApiError(error, response.status)
      return data.dados.map((e) => ({
        tipo: (e.tipo ?? TIPO_OPERACAO) as TipoEntradaTimelineOrdem,
        ocorridoEm: e.ocorridoEm ?? '',
        titulo: e.titulo ?? '',
        descricao: e.descricao ?? null,
        usuarioId: e.usuarioId ?? null,
        usuarioNome: e.usuarioNome ?? null,
        valor: e.valor ?? null,
        formaPagamento: (e.formaPagamento ?? null) as FormaPagamentoCod | null,
        cobrancaSucesso: e.cobrancaSucesso ?? null,
      }))
    },
  })
}
