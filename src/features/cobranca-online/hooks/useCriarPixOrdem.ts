import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError, type ApiError } from '@/api/errors'
import { cobrancaOnlineKeys, type IntencaoPagamentoDto } from './useCobrancaOnlineKeys'

export interface CriarPixVars {
  ordemServicoId: number
  valor?: number
  /** OrigemCobranca: 1 = Bancada, 2 = Remota. */
  origem?: 1 | 2
}

/** `POST /api/cobranca-online/pix` — gera o QR Pix da OS. */
export function useCriarPixOrdem() {
  const queryClient = useQueryClient()
  return useMutation<IntencaoPagamentoDto, ApiError, CriarPixVars>({
    mutationFn: async ({ ordemServicoId, valor, origem }) => {
      const result = (await api.POST('/api/cobranca-online/pix', {
        body: { ordemServicoId, valor: valor ?? null, origem: origem ?? 1 },
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
