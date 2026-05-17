import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  novoUsuarioSchema,
  type NovoUsuarioFormValues,
} from '../helpers/usuarioSchemas'
import { useCriarUsuario } from '../hooks/useCriarUsuario'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DEFAULTS: NovoUsuarioFormValues = {
  nomeCompleto: '',
  email: '',
  senha: '',
  role: 'Operador',
}

export function NovoUsuarioDialog({ open, onOpenChange }: Props) {
  const criar = useCriarUsuario()
  const [genericError, setGenericError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<NovoUsuarioFormValues>({
    resolver: zodResolver(novoUsuarioSchema),
    defaultValues: DEFAULTS,
  })

  // Resetar quando o dialog abre/fecha.
  useEffect(() => {
    if (open) {
      reset(DEFAULTS)
      setGenericError(null)
    }
  }, [open, reset])

  async function submit(values: NovoUsuarioFormValues) {
    setGenericError(null)
    try {
      await criar.mutateAsync(values)
      toast.success('Usuário criado.')
      onOpenChange(false)
    } catch (err: unknown) {
      const apiErr = err as { kind?: string; message?: string; detalhes?: string[] }
      if (apiErr.kind === 'validation' && apiErr.detalhes && apiErr.detalhes.length > 0) {
        let distributed = false
        for (const detalhe of apiErr.detalhes) {
          if (/e-?mail/i.test(detalhe)) {
            setError('email', { message: detalhe })
            distributed = true
          } else if (/senha|password/i.test(detalhe)) {
            setError('senha', { message: detalhe })
            distributed = true
          } else if (/nome/i.test(detalhe)) {
            setError('nomeCompleto', { message: detalhe })
            distributed = true
          } else if (/role/i.test(detalhe)) {
            setError('role', { message: detalhe })
            distributed = true
          }
        }
        if (!distributed) {
          toast.error(apiErr.detalhes.join(' '))
        }
      } else {
        const msg = apiErr.message ?? 'Não foi possível criar o usuário.'
        setGenericError(msg)
        toast.error(msg)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
          <DialogDescription>
            Cadastre um Administrador ou Operador. A senha definida aqui é temporária —
            o usuário pode trocar depois.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="nomeCompleto">Nome completo *</Label>
            <Input
              id="nomeCompleto"
              autoComplete="name"
              aria-invalid={!!errors.nomeCompleto}
              {...register('nomeCompleto')}
            />
            {errors.nomeCompleto && (
              <p role="alert" className="text-sm text-destructive">
                {errors.nomeCompleto.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
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
            <Label htmlFor="senha">Senha temporária *</Label>
            <Input
              id="senha"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.senha}
              {...register('senha')}
            />
            <p className="text-xs text-muted-foreground">
              O usuário poderá trocar a senha depois fazendo login e usando &quot;Esqueci minha
              senha&quot; (futuro). Por enquanto a senha é definida aqui.
            </p>
            {errors.senha && (
              <p role="alert" className="text-sm text-destructive">
                {errors.senha.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="role" aria-invalid={!!errors.role}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operador">Operador</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.role && (
              <p role="alert" className="text-sm text-destructive">
                {errors.role.message}
              </p>
            )}
          </div>

          {genericError && (
            <p role="alert" className="text-sm text-destructive">
              {genericError}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Criar usuário
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
