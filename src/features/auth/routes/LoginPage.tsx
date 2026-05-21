import { useLocation, useNavigate } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card'
import { MarcaEmpresa } from '@/shared/components/MarcaEmpresa'
import { LoginForm } from '../components/LoginForm'

interface LocationState {
  from?: { pathname: string }
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as LocationState | null)?.from?.pathname ?? '/'

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          {/*
            Tela de Login renderiza a logo ANTES do auth — o endpoint
            GET /api/configuracoes/empresa é anônimo (info pública de branding).
            Quando não há logo configurada, MarcaEmpresa fallback="icon-circle"
            preserva o visual original (círculo laranja com chave inglesa + nome).
          */}
          <MarcaEmpresa size="lg" fallback="icon-circle" className="mx-auto" />
          <CardDescription className="mt-1">
            Sistema de gestão da auto elétrica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm onSuccess={() => navigate(from, { replace: true })} />
        </CardContent>
      </Card>
    </div>
  )
}
