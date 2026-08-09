import { useMutation } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'

export interface RedefinirSenhaInput {
  email: string
  token: string
  novaSenha: string
}

async function redefinirSenha(input: RedefinirSenhaInput): Promise<void> {
  const { error, response } = await api.POST('/api/auth/redefinir-senha', {
    body: input,
  })
  // 204 → sucesso (sem corpo). 400 (link inválido/expirado) e 422 (senha
  // fraca) viram ApiError para o caller decidir a mensagem.
  if (error || (response.status !== 204 && !response.ok)) {
    throw toApiError(error, response.status)
  }
}

export function useRedefinirSenha() {
  return useMutation<void, ApiError, RedefinirSenhaInput>({
    mutationFn: redefinirSenha,
  })
}
