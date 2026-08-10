import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError, type ApiError } from '@/api/errors'
import { cobrancaOnlineKeys, type IntencaoPagamentoDto } from './useCobrancaOnlineKeys'

export interface CriarLinkVars {
  ordemServicoId: number
  valor?: number
  adiantar?: boolean
}

/** `POST /api/cobranca-online/link` — gera o link de Checkout Pro da OS. */
export function useCriarLinkOrdem() {
  const queryClient = useQueryClient()
  return useMutation<IntencaoPagamentoDto, ApiError, CriarLinkVars>({
    mutationFn: async ({ ordemServicoId, valor, adiantar }) => {
      const result = (await api.POST('/api/cobranca-online/link', {
        body: { ordemServicoId, valor: valor ?? null, adiantar: adiantar ?? false },
      })) as {
        data?: { dados?: IntencaoPagamentoDto | null }
        error?: unknown
        response: Response
      }
      if (result.error || !result.data) throw toApiError(result.error, result.response.status)
      return unwrap<IntencaoPagamentoDto>(result.data)
    },
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: cobrancaOnlineKeys.daOrdem(vars.ordemServicoId),
      })
    },
  })
}
