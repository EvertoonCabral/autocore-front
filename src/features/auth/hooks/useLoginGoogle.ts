import { useMutation } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError, type ApiError } from '@/api/errors'
import type { LoginResultDto } from '@/api/types'
import { useAuth } from '../auth-context'

export interface LoginGoogleInput {
  idToken: string
}

async function loginGoogle(input: LoginGoogleInput): Promise<LoginResultDto> {
  const { data, error, response } = await api.POST('/api/auth/login/google', {
    body: { idToken: input.idToken },
  })
  if (error || !data) {
    throw toApiError(error, response.status)
  }
  return unwrap<LoginResultDto>(data)
}

/**
 * Login via Google Identity Services. O back valida o id_token, seta o mesmo
 * cookie httpOnly do login por senha e devolve o LoginResultDto. O `onSuccess`
 * hidrata a sessão via `refresh()` — exatamente o mesmo caminho de `useLogin`.
 */
export function useLoginGoogle() {
  const { refresh } = useAuth()
  return useMutation<LoginResultDto, ApiError, LoginGoogleInput>({
    mutationFn: loginGoogle,
    onSuccess: async () => {
      await refresh()
    },
  })
}
