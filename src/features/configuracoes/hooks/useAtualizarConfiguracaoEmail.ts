import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError } from '@/api/errors'
import { emailConfigKeys } from './useObterConfiguracaoEmail'

export interface AtualizarConfiguracaoEmailDto {
  smtpHost: string
  smtpPorta: number
  smtpUsuario: string
  smtpSenha?: string // null/vazio = manter
  emailRemetente: string
  nomeRemetente: string
  usarTls: boolean
  usarStub: boolean
  fallbackHabilitado: boolean
}

/**
 * `PUT /api/configuracoes/email` — Admin only.
 *
 * Convenção: se `smtpSenha` for omitida ou vazia, o back mantém a atual.
 * Para substituir, envie o novo valor.
 *
 * Via cliente tipado `api`: erros viram `ApiError` (mesmo caminho dos demais
 * hooks), então o form usa `aplicarErrosValidacao` para distribuir os
 * detalhes do 422 nos campos — sem a classe de erro ad-hoc anterior.
 */
export function useAtualizarConfiguracaoEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: AtualizarConfiguracaoEmailDto) => {
      const { error, response } = await api.PUT('/api/configuracoes/email', { body })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: emailConfigKeys.config() })
    },
  })
}
