import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import type { AtualizarConfiguracaoEmpresaDto } from '@/api/types'
import { empresaKeys } from './useObterConfiguracaoEmpresa'

export interface AtualizarNomeEmpresaInput {
  nomeEmpresa: string
}

/**
 * `PUT /api/configuracoes/empresa` — Admin only.
 *
 * Atualiza apenas o nome da empresa (a logo tem endpoints próprios). O back
 * espera o envelope `AtualizarConfiguracaoEmpresaDto = { nomeEmpresa }`.
 */
export function useAtualizarNomeEmpresa() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, AtualizarNomeEmpresaInput>({
    mutationFn: async ({ nomeEmpresa }) => {
      const body: AtualizarConfiguracaoEmpresaDto = { nomeEmpresa }
      const { error, response } = await api.PUT('/api/configuracoes/empresa', {
        body,
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: empresaKeys.all })
    },
  })
}
