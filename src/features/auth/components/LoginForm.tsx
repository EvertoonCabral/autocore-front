import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { env } from '@/lib/env'
import { useLogin } from '../hooks/useLogin'
import { aplicarErrosValidacao, isValidationError } from '@/api/errors'
import { loginSchema, type LoginFormValues } from '../helpers/loginSchema'
import { GoogleLoginButton } from './GoogleLoginButton'

interface LoginFormProps {
  onSuccess: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', senha: '' },
  })

  const login = useLogin()

  async function onSubmit(values: LoginFormValues) {
    try {
      await login.mutateAsync(values)
      onSuccess()
    } catch (err: unknown) {
      if (isValidationError(err)) {
        const naoAtribuidos = aplicarErrosValidacao<LoginFormValues>(err, setError)
        toast.error(naoAtribuidos.length ? naoAtribuidos.join(' ') : err.message)
        return
      }
      toast.error(err instanceof Error ? err.message : 'Não foi possível entrar.')
    }
  }

  return (
    // Container fino e delicado em volta dos campos — borda na cor da marca
    // (--brand, escolhida pelo tenant no AccentProvider) com leve tint de fundo.
    <div className="space-y-4 rounded-xl border border-brand/30 bg-brand/[0.03] p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          className="h-12 text-base"
          {...register('email')}
        />
        {errors.email && (
          <p role="alert" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="senha">Senha</Label>
          <Link
            to="/esqueci-senha"
            className="text-sm font-medium text-primary hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>
        <Input
          id="senha"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.senha}
          className="h-12 text-base"
          {...register('senha')}
        />
        {errors.senha && (
          <p role="alert" className="text-sm text-destructive">
            {errors.senha.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" />
            Entrando…
          </>
        ) : (
          'Entrar'
        )}
      </Button>
      </form>

      {env.VITE_GOOGLE_CLIENT_ID && (
        <GoogleLoginButton clientId={env.VITE_GOOGLE_CLIENT_ID} onSuccess={onSuccess} />
      )}
    </div>
  )
}
