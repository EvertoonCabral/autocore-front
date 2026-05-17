import { useMutation } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError, type ApiError } from '@/api/errors'
import type { components } from '@/api/schema'

export type QrCodeCobrancaDto = components['schemas']['QrCodeCobrancaDto']

/**
 * `POST /api/configuracoes/cobranca/reescanear-qr` — Admin only.
 *
 * Não invalida nada: a operação só pede um novo QR à Evolution, sem mutar
 * estado persistido no banco.
 */
export function useReescanearQr() {
  return useMutation<QrCodeCobrancaDto, ApiError, void>({
    mutationFn: async () => {
      const result = (await api.POST('/api/configuracoes/cobranca/reescanear-qr')) as {
        data?: { dados?: QrCodeCobrancaDto | null }
        error?: unknown
        response: Response
      }
      if (result.error || !result.data) {
        throw toApiError(result.error, result.response.status)
      }
      return unwrap<QrCodeCobrancaDto>(result.data)
    },
  })
}
