import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import { empresaKeys } from './useObterConfiguracaoEmpresa'

/**
 * `DELETE /api/configuracoes/empresa/logo` — Admin only.
 */
export function useRemoverLogoEmpresa() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, void>({
    mutationFn: async () => {
      const result = (await api.DELETE('/api/configuracoes/empresa/logo')) as {
        error?: unknown
        response: Response
      }
      if (result.error) throw toApiError(result.error, result.response.status)
      if (!result.response.ok) {
        throw toApiError(result.error, result.response.status)
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: empresaKeys.all })
    },
  })
}
