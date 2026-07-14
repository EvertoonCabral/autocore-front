import { useMutation, useQueryClient } from '@tanstack/react-query'
import { notificarNaoAutorizado } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import { env } from '@/lib/env'
import { empresaKeys } from './useObterConfiguracaoEmpresa'

export interface AtualizarLogoResultado {
  logoHash: string
}

/**
 * `PUT /api/configuracoes/empresa/logo` — Admin only.
 *
 * Usa `fetch` direto (em vez do openapi-fetch) porque o cliente tipado não
 * suporta bem `multipart/form-data`. Mantém `credentials: 'include'` para o
 * cookie httpOnly viajar com a request.
 */
export function useAtualizarLogoEmpresa() {
  const queryClient = useQueryClient()
  return useMutation<AtualizarLogoResultado, ApiError, File>({
    mutationFn: async (arquivo) => {
      const formData = new FormData()
      formData.append('arquivo', arquivo)

      const res = await globalThis.fetch(
        `${env.VITE_API_BASE_URL}/api/configuracoes/empresa/logo`,
        {
          method: 'PUT',
          credentials: 'include',
          body: formData,
        },
      )

      if (!res.ok) {
        // fetch cru (multipart) não passa pelo middleware — notifica 401 manualmente.
        if (res.status === 401) notificarNaoAutorizado()
        let body: unknown = null
        try {
          body = await res.json()
        } catch {
          // sem body
        }
        throw toApiError(body, res.status)
      }

      const json = (await res.json()) as { dados?: { logoHash?: string | null } }
      const logoHash = json.dados?.logoHash ?? ''
      return { logoHash }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: empresaKeys.all })
    },
  })
}
