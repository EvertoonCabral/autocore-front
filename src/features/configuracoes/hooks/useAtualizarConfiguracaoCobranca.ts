import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import type { components } from '@/api/schema'
import { cobrancaConfigKeys } from './useObterConfiguracaoCobranca'

export type AtualizarConfiguracaoCobrancaDto =
  components['schemas']['AtualizarConfiguracaoCobrancaDto']

/**
 * `PUT /api/configuracoes/cobranca` — Admin only.
 *
 * Convenção: se `apiKey` for omitida ou string vazia, o back mantém a atual.
 * Para substituir, envie o novo valor.
 */
export function useAtualizarConfiguracaoCobranca() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, AtualizarConfiguracaoCobrancaDto>({
    mutationFn: async (body) => {
      const { error, response } = await api.PUT('/api/configuracoes/cobranca', {
        body,
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: cobrancaConfigKeys.config() }),
        queryClient.invalidateQueries({ queryKey: cobrancaConfigKeys.status() }),
      ])
    },
  })
}
