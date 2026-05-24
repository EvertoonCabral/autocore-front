import { useMutation, useQueryClient } from '@tanstack/react-query'
import { env } from '@/lib/env'
import { emailConfigKeys } from './useObterConfiguracaoEmail'

export interface AtualizarConfiguracaoEmailDto {
  smtpHost: string
  smtpPorta: number
  smtpUsuario: string
  smtpSenha?: string  // null/vazio = manter
  emailRemetente: string
  nomeRemetente: string
  usarTls: boolean
  usarStub: boolean
  fallbackHabilitado: boolean
}

export interface AtualizarEmailError extends Error {
  kind?: 'validation' | 'http'
  detalhes?: string[]
  status?: number
}

/**
 * `PUT /api/configuracoes/email` — Admin only.
 *
 * Convenção: se `smtpSenha` for omitida ou vazia, o back mantém a atual.
 * Para substituir, envie o novo valor.
 *
 * Em erro de validação (HTTP 422), o body do back tem o formato
 * `{ erro: string, detalhes: string[] }` — propagamos para o form
 * distribuir cada detalhe no campo correto.
 */
export function useAtualizarConfiguracaoEmail() {
  const queryClient = useQueryClient()
  return useMutation<void, AtualizarEmailError, AtualizarConfiguracaoEmailDto>({
    mutationFn: async (body) => {
      const resp = await fetch(`${env.VITE_API_BASE_URL}/api/configuracoes/email`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!resp.ok) {
        let mensagem = `Falha ao salvar configuração (HTTP ${resp.status})`
        let detalhes: string[] | undefined
        try {
          const parsed = (await resp.json()) as { erro?: string; detalhes?: string[] }
          if (parsed.erro) mensagem = parsed.erro
          detalhes = parsed.detalhes
        } catch {
          // resposta não-JSON; usa mensagem padrão
        }
        const err = new Error(mensagem) as AtualizarEmailError
        err.kind = resp.status === 422 ? 'validation' : 'http'
        err.status = resp.status
        if (detalhes) err.detalhes = detalhes
        throw err
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: emailConfigKeys.config() })
    },
  })
}
