import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError, type ApiError } from '@/api/errors'
import type { components } from '@/api/schema'
import { cobrancaOnlineKeys } from './useCobrancaOnlineKeys'

export type EnviarCobrancaResultado =
  components['schemas']['EnviarCobrancaComDocumentoResultado']

export interface EnviarCobrancaVars {
  ordemServicoId: number
  /** TipoIntencaoPagamento: 1 = Pix, 2 = Link de checkout. */
  meio: 1 | 2
}

/**
 * `POST /api/cobrancas/enviar-documento/{ordemServicoId}` — envia a cobrança
 * com o PDF anexado (WhatsApp → e-mail de fallback) e o link/QR de pagamento.
 */
export function useEnviarCobrancaComDocumento() {
  const queryClient = useQueryClient()
  return useMutation<EnviarCobrancaResultado, ApiError, EnviarCobrancaVars>({
    mutationFn: async ({ ordemServicoId, meio }) => {
      const result = (await api.POST('/api/cobrancas/enviar-documento/{ordemServicoId}', {
        params: { path: { ordemServicoId } },
        body: { meio },
      })) as {
        data?: { dados?: EnviarCobrancaResultado | null }
        error?: unknown
        response: Response
      }
      // 502 (falha de envio) ainda traz envelope com dados — trata como erro só
      // quando não há corpo.
      if (result.error && !result.data) {
        throw toApiError(result.error, result.response.status)
      }
      if (!result.data?.dados) throw toApiError(result.error, result.response.status)
      return unwrap<EnviarCobrancaResultado>(result.data)
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: cobrancaOnlineKeys.daOrdem(vars.ordemServicoId) })
      void queryClient.invalidateQueries({ queryKey: ['cobrancas', 'historico'] })
    },
  })
}
