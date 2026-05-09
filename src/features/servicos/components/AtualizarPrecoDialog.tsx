import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, DollarSign } from 'lucide-react'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { formatBRL } from '@/lib/format'
import { precoSchema, type PrecoFormValues } from '../helpers/servicoSchema'
import { useAtualizarPrecoServico } from '../hooks/useAtualizarPrecoServico'

interface Props {
  servico: { id: number; nome: string; preco: number }
}

export function AtualizarPrecoDialog({ servico }: Props) {
  const [open, setOpen] = useState(false)
  const atualizar = useAtualizarPrecoServico()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<PrecoFormValues>({
    resolver: zodResolver(precoSchema),
    defaultValues: { preco: servico.preco },
  })

  async function submit(values: PrecoFormValues) {
    try {
      await atualizar.mutateAsync({ id: servico.id, preco: values.preco })
      toast.success('Preço atualizado.')
      setOpen(false)
      reset({ preco: values.preco })
    } catch (err) {
      const apiErr = err as { message?: string }
      toast.error(apiErr.message ?? 'Não foi possível atualizar o preço.')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) reset({ preco: servico.preco })
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <DollarSign className="h-4 w-4" />
          Alterar preço
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar preço — {servico.nome}</DialogTitle>
          <DialogDescription>
            Preço atual: {formatBRL(servico.preco)}. A mudança afeta apenas novas OSs;
            OSs existentes mantêm o snapshot original.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="preco">Novo preço (R$)</Label>
            <Input
              id="preco"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              aria-invalid={!!errors.preco}
              {...register('preco')}
            />
            {errors.preco && (
              <p role="alert" className="text-sm text-destructive">
                {errors.preco.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
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
