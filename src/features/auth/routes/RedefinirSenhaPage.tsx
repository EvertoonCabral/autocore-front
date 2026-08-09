import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ShieldCheck, TriangleAlert } from 'lucide-react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MarcaEmpresa } from '@/shared/components/MarcaEmpresa'
import { aplicarErrosValidacao, isValidationError } from '@/api/errors'
import { useRedefinirSenha } from '../hooks/useRedefinirSenha'
import {
  redefinirSenhaSchema,
  type RedefinirSenhaFormValues,
} from '../helpers/senhaSchemas'

function LinkInvalido() {
  return (
    <div className="space-y-4 text-center">
      <TriangleAlert className="mx-auto h-10 w-10 text-destructive" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">O link é inválido ou expirou.</p>
      <Button asChild variant="outline" className="w-full">
        <Link to="/esqueci-senha">Solicitar novo link</Link>
      </Button>
    </div>
  )
}

export function RedefinirSenhaPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const email = params.get('email') ?? ''
  const token = params.get('token') ?? ''
  const linkFaltando = !email || !token

  const [linkExpirado, setLinkExpirado] = useState(false)
  const [redefinida, setRedefinida] = useState(false)
  const redefinir = useRedefinirSenha()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RedefinirSenhaFormValues>({
    resolver: zodResolver(redefinirSenhaSchema),
    defaultValues: { novaSenha: '', confirmar: '' },
  })

  async function onSubmit(values: RedefinirSenhaFormValues) {
    try {
      await redefinir.mutateAsync({ email, token, novaSenha: values.novaSenha })
      setRedefinida(true)
      toast.success('Senha redefinida.')
    } catch (err) {
      if (isValidationError(err)) {
        const naoAtribuidos = aplicarErrosValidacao<RedefinirSenhaFormValues>(err, setError, {
          camposValidos: ['novaSenha'],
        })
        if (naoAtribuidos.length) toast.error(naoAtribuidos.join(' '))
        return
      }
      // 400 → link inválido/expirado: troca a tela para o estado de link inválido.
      setLinkExpirado(true)
    }
  }

  function conteudo() {
    if (linkFaltando || linkExpirado) return <LinkInvalido />

    if (redefinida) {
      return (
        <div className="space-y-4 text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Sua senha foi redefinida. Você já pode entrar com a nova senha.
          </p>
          <Button className="w-full" onClick={() => navigate('/login', { replace: true })}>
            Ir para o login
          </Button>
        </div>
      )
    }

    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="novaSenha">Nova senha</Label>
          <Input
            id="novaSenha"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.novaSenha}
            {...register('novaSenha')}
          />
          {errors.novaSenha && (
            <p role="alert" className="text-sm text-destructive">
              {errors.novaSenha.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmar">Confirmar nova senha</Label>
          <Input
            id="confirmar"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmar}
            {...register('confirmar')}
          />
          {errors.confirmar && (
            <p role="alert" className="text-sm text-destructive">
              {errors.confirmar.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" />
              Redefinindo…
            </>
          ) : (
            'Redefinir senha'
          )}
        </Button>
      </form>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-3 text-center">
          <MarcaEmpresa size="lg" fallback="icon-circle" className="mx-auto" />
          <CardTitle>Redefinir senha</CardTitle>
          <CardDescription>Escolha uma nova senha para sua conta.</CardDescription>
        </CardHeader>
        <CardContent>{conteudo()}</CardContent>
      </Card>
    </div>
  )
}
