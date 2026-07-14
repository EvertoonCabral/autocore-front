import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { api } from '@/api/client'
import { receberPaginado } from '@/api/envelope'
import type { AuditoriaOperacaoDto } from '@/api/types'
import { auditoriaKeys } from './useListarOperacoesEntidade'

export interface ListarAuditoriaParams {
  usuarioId?: number
  tipoEntidade?: string
  operacao?: string
  /** ISO date (yyyy-MM-dd ou completo) — `de` inclusivo. */
  de?: string
  /** ISO date — `ate` inclusivo. */
  ate?: string
  pagina: number
  porPagina: number
}

/**
 * `GET /api/auditoria` paginado, com filtros opcionais.
 * Autoriza Admin OU usuário com flag `podeVerAuditoria`.
 */
export function useListarAuditoria(
  params: ListarAuditoriaParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: auditoriaKeys.geral(params as unknown as Record<string, unknown>),
    enabled: options?.enabled ?? true,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const query: Record<string, string | number> = {
        pagina: params.pagina,
        porPagina: params.porPagina,
      }
      if (params.usuarioId != null) query.usuarioId = params.usuarioId
      if (params.tipoEntidade) query.tipoEntidade = params.tipoEntidade
      if (params.operacao) query.operacao = params.operacao
      if (params.de) query.de = params.de
      if (params.ate) query.ate = params.ate

      const result = await api.GET('/api/auditoria', { params: { query } })
      return receberPaginado<AuditoriaOperacaoDto>(result)
    },
  })
}
