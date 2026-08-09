import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { aplicarErrosValidacao } from '@/api/errors'
import { ClienteSelect } from '@/features/clientes/components/ClienteSelect'
import { veiculoSchema, type VeiculoFormValues } from '../helpers/veiculoSchema'

interface VeiculoFormProps {
  /** Valores iniciais (em modo edição). */
  defaultValues?: Partial<VeiculoFormValues>
  submitLabel?: string
  onSubmit: (values: VeiculoFormValues) => Promise<void>
  /** Disparado pelo botão Cancelar. */
  onCancel?: () => void
  /** Em edição o dono é imutável — mostra o cliente como texto read-only. */
  modoEdicao?: boolean
  /** Nome do cliente exibido (read-only) em modo edição. */
  clienteNome?: string | null | undefined
  /** Notifica quando o form fica "sujo" (usado pelo drawer para confirmar descarte). */
  onDirtyChange?: (dirty: boolean) => void
}

export function VeiculoForm({
  defaultValues,
  submitLabel = 'Salvar',
  onSubmit,
  onCancel,
  modoEdicao = false,
  clienteNome,
  onDirtyChange,
}: VeiculoFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<VeiculoFormValues>({
    resolver: zodResolver(veiculoSchema),
    // Sem cast completo: campos texto começam como '' e a coerção do schema
    // resolve os números/opcionais no submit.
    defaultValues: {
      placa: '',
      marca: '',
      modelo: '',
      cor: '',
      chassi: '',
      renavam: '',
      observacoes: '',
      ...defaultValues,
    } as Partial<VeiculoFormValues>,
  })

  // Atualiza o form quando defaultValues chegam tarde (modo edição com fetch).
  useEffect(() => {
    if (defaultValues) {
      reset({
        clienteId: defaultValues.clienteId,
        placa: defaultValues.placa ?? '',
        marca: defaultValues.marca ?? '',
        modelo: defaultValues.modelo ?? '',
        anoFabricacao: defaultValues.anoFabricacao ?? null,
        anoModelo: defaultValues.anoModelo ?? null,
        cor: defaultValues.cor ?? '',
        chassi: defaultValues.chassi ?? '',
        renavam: defaultValues.renavam ?? '',
        observacoes: defaultValues.observacoes ?? '',
      } as Partial<VeiculoFormValues> as VeiculoFormValues)
    }
  }, [defaultValues, reset])

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  async function submit(values: VeiculoFormValues) {
    try {
      await onSubmit(values)
    } catch (err: unknown) {
      // O back envia `campo` em camelCase igual aos nomes deste form; sobras
      // (campo desconhecido) viram toast. 409/outros são tratados no caller.
      const naoAtribuidos = aplicarErrosValidacao<VeiculoFormValues>(err, setError)
      if (naoAtribuidos.length) toast.error(naoAtribuidos.join(' '))
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="cliente">Cliente *</Label>
          {modoEdicao ? (
            <p
              id="cliente"
              className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground"
            >
              {clienteNome ?? '—'}{' '}
              <span className="text-xs">(o proprietário não pode ser alterado)</span>
            </p>
          ) : (
            <>
              <Controller
                control={control}
                name="clienteId"
                render={({ field }) => (
                  <ClienteSelect value={field.value} onChange={field.onChange} />
                )}
              />
              {errors.clienteId && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.clienteId.message}
                </p>
              )}
            </>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="placa">Placa *</Label>
          <Input
            id="placa"
            placeholder="ABC1234 ou ABC1D23"
            className="uppercase"
            aria-invalid={!!errors.placa}
            {...register('placa')}
          />
          <p className="text-xs text-muted-foreground">
            Formato antigo (ABC1234) ou Mercosul (ABC1D23). Hífen e minúsculas são aceitos.
          </p>
          {errors.placa && (
            <p role="alert" className="text-sm text-destructive">
              {errors.placa.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cor">Cor</Label>
          <Input id="cor" aria-invalid={!!errors.cor} {...register('cor')} />
          {errors.cor && (
            <p role="alert" className="text-sm text-destructive">
              {errors.cor.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="marca">Marca</Label>
          <Input id="marca" aria-invalid={!!errors.marca} {...register('marca')} />
          {errors.marca && (
            <p role="alert" className="text-sm text-destructive">
              {errors.marca.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="modelo">Modelo</Label>
          <Input id="modelo" aria-invalid={!!errors.modelo} {...register('modelo')} />
          {errors.modelo && (
            <p role="alert" className="text-sm text-destructive">
              {errors.modelo.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="anoFabricacao">Ano de fabricação</Label>
          <Input
            id="anoFabricacao"
            inputMode="numeric"
            placeholder="Ex.: 2020"
            aria-invalid={!!errors.anoFabricacao}
            {...register('anoFabricacao')}
          />
          {errors.anoFabricacao && (
            <p role="alert" className="text-sm text-destructive">
              {errors.anoFabricacao.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="anoModelo">Ano do modelo</Label>
          <Input
            id="anoModelo"
            inputMode="numeric"
            placeholder="Ex.: 2021"
            aria-invalid={!!errors.anoModelo}
            {...register('anoModelo')}
          />
          {errors.anoModelo && (
            <p role="alert" className="text-sm text-destructive">
              {errors.anoModelo.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="chassi">Chassi</Label>
          <Input
            id="chassi"
            placeholder="17 caracteres alfanuméricos"
            className="uppercase"
            maxLength={17}
            aria-invalid={!!errors.chassi}
            {...register('chassi')}
          />
          {errors.chassi && (
            <p role="alert" className="text-sm text-destructive">
              {errors.chassi.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="renavam">Renavam</Label>
          <Input
            id="renavam"
            maxLength={9}
            inputMode="numeric"
            placeholder="9 a 11 dígitos"
            aria-invalid={!!errors.renavam}
            {...register('renavam')}
          />
          {errors.renavam && (
            <p role="alert" className="text-sm text-destructive">
              {errors.renavam.message}
            </p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            rows={3}
            placeholder="Anotações internas sobre o veículo."
            aria-invalid={!!errors.observacoes}
            {...register('observacoes')}
          />
          {errors.observacoes && (
            <p role="alert" className="text-sm text-destructive">
              {errors.observacoes.message}
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
