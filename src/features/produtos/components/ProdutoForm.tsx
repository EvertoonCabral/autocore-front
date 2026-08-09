import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { aplicarErrosValidacao } from '@/api/errors'
import { produtoSchema, type ProdutoFormValues } from '../helpers/produtoSchema'

interface ProdutoFormProps {
  defaultValues?: Partial<ProdutoFormValues>
  submitLabel?: string
  /** Em modo edição, ocultar o campo "estoque" — use o dialog dedicado. */
  esconderEstoqueInicial?: boolean
  onSubmit: (values: ProdutoFormValues) => Promise<void>
  onCancel?: () => void
  /** Notifica quando o form fica "sujo" (usado pelo drawer para confirmar descarte). */
  onDirtyChange?: (dirty: boolean) => void
}

export function ProdutoForm({
  defaultValues,
  submitLabel = 'Salvar',
  esconderEstoqueInicial = false,
  onSubmit,
  onCancel,
  onDirtyChange,
}: ProdutoFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProdutoFormValues>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: '',
      referencia: '',
      precoCusto: 0,
      precoVenda: 0,
      quantidadeEstoque: 0,
      estoqueMinimo: 0,
      ...defaultValues,
    },
  })

  useEffect(() => {
    if (defaultValues) {
      reset({
        nome: defaultValues.nome ?? '',
        referencia: defaultValues.referencia ?? '',
        precoCusto: defaultValues.precoCusto ?? 0,
        precoVenda: defaultValues.precoVenda ?? 0,
        quantidadeEstoque: defaultValues.quantidadeEstoque ?? 0,
        estoqueMinimo: defaultValues.estoqueMinimo ?? 0,
      })
    }
  }, [defaultValues, reset])

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  async function submit(values: ProdutoFormValues) {
    try {
      await onSubmit(values)
    } catch (err: unknown) {
      const naoAtribuidos = aplicarErrosValidacao<ProdutoFormValues>(err, setError)
      if (naoAtribuidos.length) toast.error(naoAtribuidos.join(' '))
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input id="nome" aria-invalid={!!errors.nome} {...register('nome')} />
          {errors.nome && (
            <p role="alert" className="text-sm text-destructive">
              {errors.nome.message}
            </p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="referencia">Referência</Label>
          <Input
            id="referencia"
            placeholder="Código de fabricante ou interno"
            aria-invalid={!!errors.referencia}
            {...register('referencia')}
          />
          {errors.referencia && (
            <p role="alert" className="text-sm text-destructive">
              {errors.referencia.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="precoCusto">Preço de custo (R$) *</Label>
          <Input
            id="precoCusto"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            aria-invalid={!!errors.precoCusto}
            {...register('precoCusto')}
          />
          {errors.precoCusto && (
            <p role="alert" className="text-sm text-destructive">
              {errors.precoCusto.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="precoVenda">Preço de venda (R$) *</Label>
          <Input
            id="precoVenda"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            aria-invalid={!!errors.precoVenda}
            {...register('precoVenda')}
          />
          {errors.precoVenda && (
            <p role="alert" className="text-sm text-destructive">
              {errors.precoVenda.message}
            </p>
          )}
        </div>

        {!esconderEstoqueInicial && (
          <div className="space-y-2">
            <Label htmlFor="quantidadeEstoque">Quantidade em estoque *</Label>
            <Input
              id="quantidadeEstoque"
              type="number"
              step="1"
              min="0"
              inputMode="numeric"
              aria-invalid={!!errors.quantidadeEstoque}
              {...register('quantidadeEstoque')}
            />
            {errors.quantidadeEstoque && (
              <p role="alert" className="text-sm text-destructive">
                {errors.quantidadeEstoque.message}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="estoqueMinimo">Estoque mínimo *</Label>
          <Input
            id="estoqueMinimo"
            type="number"
            step="1"
            min="0"
            inputMode="numeric"
            aria-invalid={!!errors.estoqueMinimo}
            {...register('estoqueMinimo')}
          />
          <p className="text-xs text-muted-foreground">
            Aciona alerta de reposição quando o saldo cair abaixo deste valor.
          </p>
          {errors.estoqueMinimo && (
            <p role="alert" className="text-sm text-destructive">
              {errors.estoqueMinimo.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
