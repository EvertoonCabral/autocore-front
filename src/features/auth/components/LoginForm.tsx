import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLogin } from '../hooks/useLogin'
import { loginSchema, type LoginFormValues } from '../helpers/loginSchema'

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
      const apiErr = err as { kind?: string; message?: string; detalhes?: string[] }
      if (apiErr.kind === 'validation') {
        // 422 — distribui detalhes por campo de forma simples
        for (const detalhe of apiErr.detalhes ?? []) {
          if (/email/i.test(detalhe)) setError('email', { message: detalhe })
          else if (/senha/i.test(detalhe)) setError('senha', { message: detalhe })
        }
        toast.error(apiErr.message ?? 'Dados inválidos.')
        return
      }
      toast.error(apiErr.message ?? 'Não foi possível entrar.')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <p role="alert" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="senha">Senha</Label>
        <Input
          id="senha"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.senha}
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
  )
}
