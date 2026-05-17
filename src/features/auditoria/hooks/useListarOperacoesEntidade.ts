import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError } from '@/api/errors'
import { unwrap } from '@/api/envelope'
import type { AuditoriaOperacaoDto } from '@/api/types'
import type { TipoEntidadeAuditavel } from '../helpers/auditoriaLabels'

export const auditoriaKeys = {
  all: ['auditoria'] as const,
  porEntidade: (tipo: string, id: number) => ['auditoria', 'entidade', tipo, id] as const,
  geral: (params: Record<string, unknown>) => ['auditoria', 'geral', params] as const,
}

/**
 * `GET /api/auditoria/{tipoEntidade}/{entidadeId}` — timeline de operações
 * de uma entidade específica. Autoriza Admin OU usuário com flag
 * `podeVerAuditoria`. Sem paginação.
 *
 * O hook permanece desabilitado se `enabled === false` — usado pelo
 * `<AuditoriaTimeline>` para evitar request quando o usuário não tem
 * permissão.
 */
export function useListarOperacoesEntidade(
  tipoEntidade: TipoEntidadeAuditavel,
  entidadeId: number,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: auditoriaKeys.porEntidade(tipoEntidade, entidadeId),
    enabled: (options?.enabled ?? true) && Number.isFinite(entidadeId) && entidadeId > 0,
    queryFn: async () => {
      const result = (await api.GET('/api/auditoria/{tipoEntidade}/{entidadeId}', {
        params: { path: { tipoEntidade, entidadeId } },
      })) as {
        data?: { dados?: AuditoriaOperacaoDto[] | null }
        error?: unknown
        response: Response
      }
      if (result.error || !result.data) {
        throw toApiError(result.error, result.response.status)
      }
      return unwrap<AuditoriaOperacaoDto[]>(result.data) ?? []
    },
  })
}
