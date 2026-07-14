import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError, type ApiError } from '@/api/errors'
import type { CobrancaIndividualResultado } from '@/api/types'
import { cobrancasKeys } from './useListarHistorico'
import { pagamentosKeys } from '@/features/pagamentos/hooks/useListarPendencias'
import { ordensKeys } from '@/features/ordens/hooks/useListarOrdens'

/**
 * `POST /api/cobrancas/disparar/{ordemServicoId}` — cobrança individual proativa.
 *
 * Aberta a Operador e Admin (não exige `<Can>`). O back valida:
 * - OS está Concluída
 * - Saldo devedor > 0
 * - Cliente ativo
 * - Idempotência diária (1 envio com sucesso por OS por dia)
 *
 * O resultado discrimina o status: Enviada, Falha, JaEnviadaHoje, OsInvalida.
 *
 * Mapeamento HTTP no back:
 *   - Enviada / JaEnviadaHoje → 200 OK
 *   - OsInvalida → 400 Bad Request
 *   - Falha (Evolution API indisponível) → 502 Bad Gateway
 *
 * Em todos os casos o body é o mesmo envelope `ApiResponse<CobrancaIndividualResultado>`.
 * Este hook normaliza: sucesso ou erro com discriminador retorna o objeto para
 * o caller fazer `switch (r.status)`; erros sem discriminador (401, 500 inesperado, etc.)
 * caem no `throw toApiError(...)` clássico.
 */
export function useCobrarOrdem() {
  const queryClient = useQueryClient()
  return useMutation<CobrancaIndividualResultado, ApiError, number>({
    mutationFn: async (ordemServicoId) => {
      const result = (await api.POST('/api/cobrancas/disparar/{ordemServicoId}', {
        params: { path: { ordemServicoId } },
      })) as {
        data?: { dados?: CobrancaIndividualResultado | null }
        error?: { dados?: CobrancaIndividualResultado | null } | unknown
        response: Response
      }

      // 200 OK — caminho feliz
      if (result.data?.dados) {
        return unwrap<CobrancaIndividualResultado>(result.data)
      }

      // 400 (OsInvalida) e 502 (Falha) ainda trazem o discriminador no body —
      // extraímos e retornamos como se fosse sucesso para o caller decidir
      // a mensagem pelo r.status. (Sem isso, o caller cairia no catch
      // genérico e perderia "erroEnvio"/"mensagem" específica do back.)
      const errBody = result.error as { dados?: CobrancaIndividualResultado | null } | undefined
      if (errBody?.dados && typeof errBody.dados.status === 'string') {
        return errBody.dados
      }

      throw toApiError(result.error, result.response.status)
    },
    onSuccess: async () => {
      // A cobrança gera uma entrada na timeline da OS e pode mudar o estado
      // exibido no detalhe — invalidar ordensKeys.all cobre detalhe e timeline
      // (antes só cobranças/pendências eram atualizadas).
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: cobrancasKeys.all }),
        queryClient.invalidateQueries({ queryKey: pagamentosKeys.all }),
        queryClient.invalidateQueries({ queryKey: ordensKeys.all }),
      ])
    },
  })
}
