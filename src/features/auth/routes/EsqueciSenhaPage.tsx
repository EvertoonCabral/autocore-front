import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthShell } from '../components/AuthShell'
import { useEsqueciSenha } from '../hooks/useEsqueciSenha'
import {
  esqueciSenhaSchema,
  type EsqueciSenhaFormValues,
} from '../helpers/senhaSchemas'

const MENSAGEM_GENERICA =
  'Se houver uma conta com este e-mail, enviamos as instruções.'

export function EsqueciSenhaPage() {
  const [enviado, setEnviado] = useState(false)
  const esqueciSenha = useEsqueciSenha()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EsqueciSenhaFormValues>({
    resolver: zodResolver(esqueciSenhaSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(values: EsqueciSenhaFormValues) {
    try {
      await esqueciSenha.mutateAsync({ email: values.email })
      // Sempre mostra o mesmo painel — não revela se o e-mail existe.
      setEnviado(true)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Não foi possível enviar as instruções.',
      )
    }
  }

  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="Informe seu e-mail para receber as instruções de redefinição."
    >
      {enviado ? (
        <div className="space-y-4">
          <MailCheck className="h-10 w-10 text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">{MENSAGEM_GENERICA}</p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Voltar para o login</Link>
          </Button>
        </div>
      ) : (
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                Enviando…
              </>
            ) : (
              'Enviar instruções'
            )}
          </Button>

          <div>
            <Link to="/login" className="text-sm text-primary hover:underline">
              Voltar para o login
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  )
}
