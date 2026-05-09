import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, PackagePlus } from 'lucide-react'
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
import { ajustarEstoqueSchema, type AjustarEstoqueFormValues } from '../helpers/produtoSchema'
import { useAjustarEstoque } from '../hooks/useAjustarEstoque'

interface Props {
  produto: { id: number; nome: string; quantidadeEstoque: number }
}

export function AjustarEstoqueDialog({ produto }: Props) {
  const [open, setOpen] = useState(false)
  const ajustar = useAjustarEstoque()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AjustarEstoqueFormValues>({
    resolver: zodResolver(ajustarEstoqueSchema),
    defaultValues: { quantidade: 0 },
  })

  const ajuste = Number(watch('quantidade')) || 0
  const novoSaldo = produto.quantidadeEstoque + ajuste
  const saldoNegativo = novoSaldo < 0

  async function submit(values: AjustarEstoqueFormValues) {
    if (produto.quantidadeEstoque + values.quantidade < 0) {
      toast.error('Ajuste resultaria em estoque negativo.')
      return
    }
    try {
      await ajustar.mutateAsync({ id: produto.id, quantidade: values.quantidade })
      toast.success('Estoque ajustado.')
      setOpen(false)
      reset({ quantidade: 0 })
    } catch (err) {
      const apiErr = err as { message?: string }
      toast.error(apiErr.message ?? 'Não foi possível ajustar o estoque.')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) reset({ quantidade: 0 })
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PackagePlus className="h-4 w-4" />
          Ajustar estoque
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustar estoque — {produto.nome}</DialogTitle>
          <DialogDescription>
            Use valor positivo para entrada (compra, devolução) e negativo para saída
            (perda, transferência). Ajustes que resultem em saldo negativo são bloqueados.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade (+ entrada, − saída)</Label>
            <Input
              id="quantidade"
              type="number"
              step="1"
              inputMode="numeric"
              aria-invalid={!!errors.quantidade}
              {...register('quantidade')}
            />
            {errors.quantidade && (
              <p role="alert" className="text-sm text-destructive">
                {errors.quantidade.message}
              </p>
            )}
          </div>

          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Estoque atual</span>
              <span className="tabular-nums">{produto.quantidadeEstoque}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-muted-foreground">Após ajuste</span>
              <span
                className={`tabular-nums font-medium ${saldoNegativo ? 'text-destructive' : ''}`}
              >
                {novoSaldo}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || saldoNegativo}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Confirmar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
