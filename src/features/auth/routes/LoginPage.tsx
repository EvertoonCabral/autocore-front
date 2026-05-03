import { useLocation, useNavigate } from 'react-router-dom'
import { Wrench } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>AutoCore</CardTitle>
            <CardDescription className="mt-1">
              Sistema de gestão da auto elétrica
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <LoginForm onSuccess={() => navigate(from, { replace: true })} />
        </CardContent>
      </Card>
    </div>
  )
}
