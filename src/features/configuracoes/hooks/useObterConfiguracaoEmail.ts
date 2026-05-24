import { useQuery } from '@tanstack/react-query'
import { env } from '@/lib/env'

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
 */
export function useObterConfiguracaoEmail() {
  return useQuery({
    queryKey: emailConfigKeys.config(),
    queryFn: async () => {
      const resp = await fetch(`${env.VITE_API_BASE_URL}/api/configuracoes/email`, {
        credentials: 'include',
      })
      if (!resp.ok) {
        throw new Error(`Falha ao carregar configuração de email (HTTP ${resp.status})`)
      }
      const body = (await resp.json()) as { dados: ConfiguracaoEmailDto }
      return body.dados
    },
  })
}
