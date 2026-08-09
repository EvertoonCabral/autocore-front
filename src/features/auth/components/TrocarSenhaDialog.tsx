import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { aplicarErrosValidacao, isValidationError } from '@/api/errors'
import { useTrocarSenha } from '../hooks/useTrocarSenha'
import {
  trocarSenhaSchema,
  type TrocarSenhaFormValues,
} from '../helpers/senhaSchemas'

interface TrocarSenhaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function TrocarSenhaDialog({ open, onOpenChange }: TrocarSenhaDialogProps) {
  const trocar = useTrocarSenha()

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TrocarSenhaFormValues>({
    resolver: zodResolver(trocarSenhaSchema),
    defaultValues: { senhaAtual: '', novaSenha: '', confirmar: '' },
  })

  function fechar(aberto: boolean) {
    if (!aberto) reset()
    onOpenChange(aberto)
  }

  async function onSubmit(values: TrocarSenhaFormValues) {
    try {
      await trocar.mutateAsync({
        senhaAtual: values.senhaAtual,
        novaSenha: values.novaSenha,
      })
      toast.success('Senha alterada com sucesso.')
      reset()
      onOpenChange(false)
    } catch (err) {
      if (isValidationError(err)) {
        const naoAtribuidos = aplicarErrosValidacao<TrocarSenhaFormValues>(err, setError, {
          camposValidos: ['senhaAtual', 'novaSenha'],
        })
        if (naoAtribuidos.length) toast.error(naoAtribuidos.join(' '))
        return
      }
      toast.error(err instanceof Error ? err.message : 'Não foi possível trocar a senha.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={fechar}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Trocar senha</DialogTitle>
          <DialogDescription>
            Informe a senha atual e escolha uma nova senha.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="senhaAtual">Senha atual</Label>
            <Input
              id="senhaAtual"
              type="password"
              autoComplete="current-password"
              aria-invalid={!!errors.senhaAtual}
              {...register('senhaAtual')}
            />
            {errors.senhaAtual && (
              <p role="alert" className="text-sm text-destructive">
                {errors.senhaAtual.message}
              </p>
            )}
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => fechar(false)}
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
