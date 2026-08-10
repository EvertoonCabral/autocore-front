import { useLocation, useNavigate } from 'react-router-dom'
import { useObterConfiguracaoEmpresa } from '@/features/configuracoes/hooks/useObterConfiguracaoEmpresa'
import { AuthShell } from '../components/AuthShell'
import { LoginForm } from '../components/LoginForm'

interface LocationState {
  from?: { pathname: string }
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as LocationState | null)?.from?.pathname ?? '/'

  const { data } = useObterConfiguracaoEmpresa()
  const nomeEmpresa = data?.nomeEmpresa?.trim() || 'AutoCore'

  return (
    <AuthShell eyebrow="Entrar em" title={nomeEmpresa} subtitle="Sistema de gestão da auto elétrica">
      <LoginForm onSuccess={() => navigate(from, { replace: true })} />
    </AuthShell>
  )
}
