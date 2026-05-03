import { useMutation } from '@tanstack/react-query'
import { api } from '@/api/client'
import { unwrap } from '@/api/envelope'
import { toApiError, type ApiError } from '@/api/errors'
import type { LoginResultDto } from '@/api/types'
import { useAuth } from '../auth-context'

export interface LoginInput {
  email: string
  senha: string
}

async function login(input: LoginInput): Promise<LoginResultDto> {
  const { data, error, response } = await api.POST('/api/auth/login', { body: input })
  if (error || !data) {
    throw toApiError(error, response.status)
  }
  return unwrap<LoginResultDto>(data)
}

export function useLogin() {
  const { refresh } = useAuth()
  return useMutation<LoginResultDto, ApiError, LoginInput>({
    mutationFn: login,
    onSuccess: async () => {
      // Cookie httpOnly já foi setado pelo back; basta hidratar /me.
      await refresh()
    },
  })
}
