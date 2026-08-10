import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CreditCard, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import {
  FORMA_PAGAMENTO_OPTIONS,
  FormaPagamentoValues,
  type FormaPagamento,
} from '@/shared/enums/formaPagamento'
import {
  pagamentoSchemaComSaldo,
  type PagamentoFormValues,
} from '../helpers/pagamentoSchema'
import { useRegistrarPagamento } from '../hooks/useRegistrarPagamento'

interface Props {
  ordemId: number
  numero: string
  saldoDevedor: number
  /** Apenas habilita o gatilho se OS está concluída (back exige). */
  podeRegistrar: boolean
}

export function RegistrarPagamentoDialog({ ordemId, numero, saldoDevedor, podeRegistrar }: Props) {
  const [open, setOpen] = useState(false)
  const registrar = useRegistrarPagamento()

  const schema = pagamentoSchemaComSaldo(saldoDevedor)

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PagamentoFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      valor: saldoDevedor,
      forma: FormaPagamentoValues.Pix,
      observacao: '',
    },
  })

  const valor = Number(watch('valor')) || 0
  const restante = Math.max(0, saldoDevedor - valor)

  async function submit(values: PagamentoFormValues) {
    try {
      await registrar.mutateAsync({ ordemId, values })
      toast.success('Pagamento registrado.')
      setOpen(false)
      reset({
        valor: saldoDevedor,
        forma: FormaPagamentoValues.Pix,
        observacao: '',
      })
    } catch (err) {
      const apiErr = err as { message?: string }
      toast.error(apiErr.message ?? 'Não foi possível registrar o pagamento.')
    }
  }

  // Saldo zerado → não há o que pagar
  const semSaldo = saldoDevedor <= 0

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) {
          reset({
            valor: saldoDevedor,
            forma: FormaPagamentoValues.Pix,
            observacao: '',
          })
        }
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={!podeRegistrar || semSaldo}>
          <CreditCard className="h-4 w-4" />
          Registrar pagamento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pagamento — {numero}</DialogTitle>
          <DialogDescription>
            Saldo devedor atual: <strong>{formatBRL(saldoDevedor)}</strong>. O valor não pode
            exceder esse limite.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="valor">Valor (R$) *</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0.01"
                inputMode="decimal"
                aria-invalid={!!errors.valor}
                {...register('valor')}
              />
              {errors.valor && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.valor.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="forma">Forma *</Label>
              <Controller
                control={control}
                name="forma"
                render={({ field }) => (
                  <Select
                    value={field.value ? String(field.value) : String(FormaPagamentoValues.Pix)}
                    onValueChange={(v) => field.onChange(Number(v) as FormaPagamento)}
                  >
                    <SelectTrigger id="forma">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMA_PAGAMENTO_OPTIONS.map((f) => (
                        <SelectItem key={f.value} value={String(f.value)}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.forma && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.forma.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao">Observação</Label>
            <Textarea
              id="observacao"
              rows={2}
              placeholder="Notas internas sobre o pagamento (opcional)"
              aria-invalid={!!errors.observacao}
              {...register('observacao')}
            />
            {errors.observacao && (
              <p role="alert" className="text-sm text-destructive">
                {errors.observacao.message}
              </p>
            )}
          </div>

          <div className="rounded-md border bg-muted/40 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Saldo devedor</span>
              <span className="tabular-nums">{formatBRL(saldoDevedor)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-muted-foreground">Após este pagamento</span>
              <span
                className={`tabular-nums font-medium ${restante === 0 ? 'text-success-foreground' : ''}`}
              >
                {formatBRL(restante)}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
