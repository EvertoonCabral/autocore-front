import { useMutation } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'

export interface TrocarSenhaInput {
  senhaAtual: string
  novaSenha: string
}

async function trocarSenha(input: TrocarSenhaInput): Promise<void> {
  const { error, response } = await api.POST('/api/auth/senha', { body: input })
  // 204 → sucesso. 422 (senhaAtual errada / política) vira ApiError.
  if (error || (response.status !== 204 && !response.ok)) {
    throw toApiError(error, response.status)
  }
}

export function useTrocarSenha() {
  return useMutation<void, ApiError, TrocarSenhaInput>({
    mutationFn: trocarSenha,
  })
}
