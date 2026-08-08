import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import type { AtualizarAparenciaDto } from '@/api/types'
import { empresaKeys } from './useObterConfiguracaoEmpresa'

export interface AtualizarAparenciaInput {
  /** Hex "#RRGGBB" ou null (null = volta ao default laranja). */
  accentLight: string | null
  accentDark: string | null
}

/**
 * `PUT /api/configuracoes/empresa/aparencia` — Admin only.
 *
 * Ao concluir, invalida a query da empresa: o <AccentProvider> reage à nova
 * data e re-injeta as CSS vars do accent, então a mudança aparece na hora
 * sem reload.
 */
export function useAtualizarAparencia() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, AtualizarAparenciaInput>({
    mutationFn: async ({ accentLight, accentDark }) => {
      const body: AtualizarAparenciaDto = { accentLight, accentDark }
      const { error, response } = await api.PUT('/api/configuracoes/empresa/aparencia', {
        body,
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: empresaKeys.all })
    },
  })
}
