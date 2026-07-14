import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { UsuarioDto } from '@/api/types'
import {
  editarUsuarioSchema,
  type EditarUsuarioFormValues,
} from '../helpers/usuarioSchemas'
import { useAtualizarUsuario } from '../hooks/useAtualizarUsuario'
import { aplicarErrosValidacao, isValidationError } from '@/api/errors'

interface Props {
  usuario: UsuarioDto
  usuarioCorrenteId: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditarUsuarioDialog({
  usuario,
  usuarioCorrenteId,
  open,
  onOpenChange,
}: Props) {
  const atualizar = useAtualizarUsuario()
  const [genericError, setGenericError] = useState<string | null>(null)

  const isProprioUsuario = usuario.id != null && usuario.id === usuarioCorrenteId

  const defaults: EditarUsuarioFormValues = {
    nomeCompleto: usuario.nomeCompleto ?? '',
    ativo: usuario.ativo ?? true,
    novaSenha: '',
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EditarUsuarioFormValues>({
    resolver: zodResolver(editarUsuarioSchema),
    defaultValues: defaults,
  })

  useEffect(() => {
    if (open) {
      reset({
        nomeCompleto: usuario.nomeCompleto ?? '',
        ativo: usuario.ativo ?? true,
        novaSenha: '',
      })
      setGenericError(null)
    }
  }, [open, reset, usuario.nomeCompleto, usuario.ativo])

  async function submit(values: EditarUsuarioFormValues) {
    setGenericError(null)
    if (usuario.id == null) return
    const senhaPreenchida = values.novaSenha !== undefined && values.novaSenha !== ''
    const body = {
      nomeCompleto: values.nomeCompleto,
      ativo: values.ativo,
      ...(senhaPreenchida ? { novaSenha: values.novaSenha as string } : {}),
    }
    try {
      await atualizar.mutateAsync({ id: usuario.id, body })
      toast.success('Usuário atualizado.')
      onOpenChange(false)
    } catch (err: unknown) {
      if (isValidationError(err)) {
        const naoAtribuidos = aplicarErrosValidacao<EditarUsuarioFormValues>(err, setError)
        if (naoAtribuidos.length) toast.error(naoAtribuidos.join(' '))
      } else {
        const msg = err instanceof Error ? err.message : 'Não foi possível atualizar o usuário.'
        setGenericError(msg)
        toast.error(msg)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
          <DialogDescription>
            {usuario.email ?? '—'} · role:{' '}
            <span className="font-medium">{usuario.role ?? '—'}</span>
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

          <div className="flex items-start justify-between gap-3 rounded-md border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="ativo" className="cursor-pointer">
                Ativo
              </Label>
              <p className="text-xs text-muted-foreground">
                {isProprioUsuario
                  ? 'Você não pode desativar seu próprio usuário.'
                  : 'Desativar bloqueia o login sem apagar o histórico.'}
              </p>
            </div>
            <Controller
              control={control}
              name="ativo"
              render={({ field }) => (
                <Switch
                  id="ativo"
                  aria-label="Ativo"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isProprioUsuario}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="novaSenha">Nova senha</Label>
            <Input
              id="novaSenha"
              type="password"
              autoComplete="new-password"
              aria-invalid={!!errors.novaSenha}
              {...register('novaSenha')}
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para não alterar.
            </p>
            {errors.novaSenha && (
              <p role="alert" className="text-sm text-destructive">
                {errors.novaSenha.message}
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
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
