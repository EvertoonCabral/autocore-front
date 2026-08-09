import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { aplicarErrosValidacao } from '@/api/errors'
import { servicoSchema, type ServicoFormValues } from '../helpers/servicoSchema'

interface ServicoFormProps {
  defaultValues?: Partial<ServicoFormValues>
  submitLabel?: string
  /** Em modo edição, escondemos o campo Preço se Operador não pode alterá-lo. */
  precoReadonly?: boolean
  onSubmit: (values: ServicoFormValues) => Promise<void>
  onCancel?: () => void
  /** Notifica quando o form fica "sujo" (usado pelo drawer para confirmar descarte). */
  onDirtyChange?: (dirty: boolean) => void
}

export function ServicoForm({
  defaultValues,
  submitLabel = 'Salvar',
  precoReadonly = false,
  onSubmit,
  onCancel,
  onDirtyChange,
}: ServicoFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ServicoFormValues>({
    resolver: zodResolver(servicoSchema),
    // Campos numéricos opcionais começam como null (input vazio); a coerção do
    // schema resolve no submit. Mesmo padrão de VeiculoForm.
    defaultValues: {
      nome: '',
      descricao: '',
      preco: 0,
      ehMaoDeObraPadrao: false,
      garantiaDias: null,
      tempoEstimadoMinutos: null,
      categoria: '',
      ...defaultValues,
    } as Partial<ServicoFormValues>,
  })

  useEffect(() => {
    if (defaultValues) {
      reset({
        nome: defaultValues.nome ?? '',
        descricao: defaultValues.descricao ?? '',
        preco: defaultValues.preco ?? 0,
        ehMaoDeObraPadrao: defaultValues.ehMaoDeObraPadrao ?? false,
        garantiaDias: defaultValues.garantiaDias ?? null,
        tempoEstimadoMinutos: defaultValues.tempoEstimadoMinutos ?? null,
        categoria: defaultValues.categoria ?? '',
      } as Partial<ServicoFormValues> as ServicoFormValues)
    }
  }, [defaultValues, reset])

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  async function submit(values: ServicoFormValues) {
    try {
      await onSubmit(values)
    } catch (err: unknown) {
      const naoAtribuidos = aplicarErrosValidacao<ServicoFormValues>(err, setError)
      if (naoAtribuidos.length) toast.error(naoAtribuidos.join(' '))
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
      <div className="space-y-2">
        <Label htmlFor="nome">Nome *</Label>
        <Input id="nome" aria-invalid={!!errors.nome} {...register('nome')} />
        {errors.nome && (
          <p role="alert" className="text-sm text-destructive">
            {errors.nome.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea id="descricao" rows={3} aria-invalid={!!errors.descricao} {...register('descricao')} />
        {errors.descricao && (
          <p role="alert" className="text-sm text-destructive">
            {errors.descricao.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="preco">Preço (R$) *</Label>
          <Input
            id="preco"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            disabled={precoReadonly}
            aria-invalid={!!errors.preco}
            {...register('preco')}
          />
          {precoReadonly && (
            <p className="text-xs text-muted-foreground">Apenas Admin pode alterar o preço.</p>
          )}
          {errors.preco && (
            <p role="alert" className="text-sm text-destructive">
              {errors.preco.message}
            </p>
          )}
        </div>

        <div className="flex items-center pt-7">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              {...register('ehMaoDeObraPadrao')}
            />
            Definir como mão de obra padrão
          </label>
        </div>
      </div>

      <p className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Apenas um serviço pode ser <strong>mão de obra padrão</strong> por vez. Ao marcar este,
        o serviço anterior perde a flag automaticamente.
      </p>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="garantiaDias">Garantia (dias)</Label>
          <Input
            id="garantiaDias"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            placeholder="Ex.: 90"
            aria-invalid={!!errors.garantiaDias}
            {...register('garantiaDias')}
          />
          {errors.garantiaDias && (
            <p role="alert" className="text-sm text-destructive">
              {errors.garantiaDias.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="tempoEstimadoMinutos">Tempo estimado (min)</Label>
          <Input
            id="tempoEstimadoMinutos"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            placeholder="Ex.: 60"
            aria-invalid={!!errors.tempoEstimadoMinutos}
            {...register('tempoEstimadoMinutos')}
          />
          {errors.tempoEstimadoMinutos && (
            <p role="alert" className="text-sm text-destructive">
              {errors.tempoEstimadoMinutos.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoria">Categoria</Label>
          <Input
            id="categoria"
            placeholder="Ex.: Elétrica, Suspensão…"
            aria-invalid={!!errors.categoria}
            {...register('categoria')}
          />
          {errors.categoria && (
            <p role="alert" className="text-sm text-destructive">
              {errors.categoria.message}
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
