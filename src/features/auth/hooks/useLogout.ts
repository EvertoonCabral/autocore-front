import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { useAuth } from '../auth-context'

export function useLogout() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: async () => {
      await api.POST('/api/auth/logout')
    },
    // Mesmo se o back falhar, derruba o estado local — segurança em primeiro lugar.
    onSettled: () => {
      signOut()
      navigate('/login', { replace: true })
    },
  })
}
