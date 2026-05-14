import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'
import type { ConfigKey } from '../helpers/configuracaoSchema'
import { configuracoesKeys } from './useListarConfiguracoes'

interface AtualizarVars {
  chave: ConfigKey
  valor: string
}

/** `PUT /api/configuracoes/{chave}` — Admin only. */
export function useAtualizarConfiguracao() {
  const queryClient = useQueryClient()
  return useMutation<void, ApiError, AtualizarVars>({
    mutationFn: async ({ chave, valor }) => {
      const { error, response } = await api.PUT('/api/configuracoes/{chave}', {
        params: { path: { chave } },
        body: { valor },
      })
      if (error) throw toApiError(error, response.status)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: configuracoesKeys.all })
    },
  })
}
