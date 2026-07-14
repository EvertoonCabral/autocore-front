import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError } from '@/api/errors'

export interface ConfiguracaoEmailDto {
  smtpHost: string
  smtpPorta: number
  smtpUsuario: string
  smtpSenhaDefinida: boolean
  emailRemetente: string
  nomeRemetente: string
  usarTls: boolean
  usarStub: boolean
  fallbackHabilitado: boolean
  atualizadoEm?: string | null
  atualizadoPorUsuarioId?: number | null
  atualizadoPorUsuarioNome?: string | null
}

export const emailConfigKeys = {
  all: ['configuracao-email'] as const,
  config: () => [...emailConfigKeys.all, 'config'] as const,
}

/**
 * `GET /api/configuracoes/email` — Admin only. Senha SMTP nunca é exposta
 * em texto puro — back devolve apenas `smtpSenhaDefinida: bool`.
 *
 * Via cliente tipado `api` (openapi-fetch): o DTO gerado marca tudo como
 * opcional, então mapeamos para a forma não-opcional consumida pelo form,
 * preenchendo defaults. Se o contrato mudar, o mapeamento quebra em compile.
 */
export function useObterConfiguracaoEmail() {
  return useQuery({
    queryKey: emailConfigKeys.config(),
    queryFn: async (): Promise<ConfiguracaoEmailDto> => {
      const { data, error, response } = await api.GET('/api/configuracoes/email')
      if (error || !data?.dados) throw toApiError(error, response.status)
      const d = data.dados
      return {
        smtpHost: d.smtpHost ?? '',
        smtpPorta: d.smtpPorta ?? 0,
        smtpUsuario: d.smtpUsuario ?? '',
        smtpSenhaDefinida: d.smtpSenhaDefinida ?? false,
        emailRemetente: d.emailRemetente ?? '',
        nomeRemetente: d.nomeRemetente ?? '',
        usarTls: d.usarTls ?? false,
        usarStub: d.usarStub ?? false,
        fallbackHabilitado: d.fallbackHabilitado ?? false,
        atualizadoEm: d.atualizadoEm ?? null,
        atualizadoPorUsuarioId: d.atualizadoPorUsuarioId ?? null,
        atualizadoPorUsuarioNome: d.atualizadoPorUsuarioNome ?? null,
      }
    },
  })
}
