import { useQuery } from '@tanstack/react-query'
import { env } from '@/lib/env'

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
 * Usamos `fetch` direto (não openapi-fetch) porque o tipo gerado no schema
 * ainda não foi atualizado nesta branch — quando o `npm run api:types` for
 * rodado, o consumidor pode migrar para `api.GET` sem mudar a forma do dado.
 */
export function useObterTimelineOrdem(ordemId: number | undefined) {
  return useQuery({
    queryKey: ['ordens', 'timeline', ordemId],
    enabled: !!ordemId && ordemId > 0,
    queryFn: async () => {
      const resp = await fetch(
        `${env.VITE_API_BASE_URL}/api/ordens/${ordemId}/timeline`,
        { credentials: 'include' },
      )
      if (!resp.ok) {
        throw new Error(`Falha ao carregar timeline (HTTP ${resp.status})`)
      }
      const body = (await resp.json()) as { dados: TimelineEntradaOrdem[] }
      return body.dados
    },
  })
}
