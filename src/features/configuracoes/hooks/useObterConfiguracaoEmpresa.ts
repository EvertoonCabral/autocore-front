import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError } from '@/api/errors'
import type { ConfiguracaoEmpresaDto } from '@/api/types'

export const empresaKeys = {
  all: ['configuracao-empresa'] as const,
  metadata: () => [...empresaKeys.all, 'metadata'] as const,
}

/**
 * `GET /api/configuracoes/empresa` — qualquer autenticado.
 *
 * DTO leve com `nomeEmpresa`, `logoHash`, `logoMimeType`, etc. A imagem em si
 * é baixada via `<img src=".../empresa/logo?v={logoHash}">` direto, deixando
 * o browser cachear (24h, ETag = logoHash).
 */
export function useObterConfiguracaoEmpresa() {
  return useQuery({
    queryKey: empresaKeys.metadata(),
    queryFn: async () => {
      const result = (await api.GET('/api/configuracoes/empresa')) as {
        data?: { dados?: ConfiguracaoEmpresaDto | null }
        error?: unknown
        response: Response
      }
      if (result.error || !result.data) {
        throw toApiError(result.error, result.response.status)
      }
      return unwrap<ConfiguracaoEmpresaDto>(result.data)
    },
    staleTime: 5 * 60_000,
  })
}
