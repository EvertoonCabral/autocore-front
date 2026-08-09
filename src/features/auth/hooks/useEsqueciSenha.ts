import { useMutation } from '@tanstack/react-query'
import { api } from '@/api/client'
import { toApiError, type ApiError } from '@/api/errors'

export interface EsqueciSenhaInput {
  email: string
}

async function esqueciSenha(input: EsqueciSenhaInput): Promise<void> {
  // O back SEMPRE responde 200 genérico (não revela se o e-mail existe) — o
  // contrato OpenAPI só declara 200, então `error` é `never`. Só tratamos
  // falha de rede / erro inesperado via `response.ok`.
  const { response } = await api.POST('/api/auth/esqueci-senha', {
    body: { email: input.email },
  })
  if (!response.ok) {
    throw toApiError(undefined, response.status)
  }
}

export function useEsqueciSenha() {
  return useMutation<void, ApiError, EsqueciSenhaInput>({
    mutationFn: esqueciSenha,
  })
}
