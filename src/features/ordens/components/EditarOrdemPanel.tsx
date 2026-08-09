import { useEffect } from 'react'
import { useForm, Controller, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { VeiculoSelect } from '@/features/veiculos/components/VeiculoSelect'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  STATUS_EDITAVEIS_OPTIONS,
  type StatusOrdem,
  podeEditarItens,
} from '@/shared/enums/statusOrdem'
import {
  atualizarOrdemSchema,
  type AtualizarOrdemFormValues,
} from '../helpers/ordemSchemas'
import { useAtualizarOrdem } from '../hooks/useAtualizarOrdem'

interface Props {
  ordemId: number
  status: StatusOrdem
  /** Dono da OS — usado para listar os veículos elegíveis. */
  clienteId?: number | null | undefined
  veiculoId?: number | null | undefined
  quilometragemEntrada?: number | null | undefined
  descricaoProblema?: string | null | undefined
  observacoes?: string | null | undefined
  /** UTC ISO vindo do back; convertido para wall-clock local no form. */
  dataAgendamentoInicio?: string | null | undefined
}

type StatusEditavel = 1 | 2 | 3
const asStatusEditavel = (s: StatusOrdem): StatusEditavel =>
  s === 1 || s === 2 || s === 3 ? s : 1

/** UTC ISO → valor esperado por `<input type="datetime-local">` (local). */
const isoParaDatetimeLocal = (iso: string | null | undefined): string =>
  iso ? format(new Date(iso), "yyyy-MM-dd'T'HH:mm") : ''

/**
 * Painel inline para editar OS. Visível apenas quando `podeEditarItens(status)`.
 * O status pode ser alterado entre os 3 não-finais (Aberta/EmAndamento/AguardandoProduto).
 * Para Concluir/Cancelar, use os botões dedicados — endpoints próprios.
 */
export function EditarOrdemPanel({
  ordemId,
  status,
  clienteId,
  veiculoId,
  quilometragemEntrada,
  descricaoProblema,
  observacoes,
  dataAgendamentoInicio,
}: Props) {
  const atualizar = useAtualizarOrdem()
  const editavel = podeEditarItens(status)

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<AtualizarOrdemFormValues>({
    resolver: zodResolver(atualizarOrdemSchema),
    defaultValues: {
      veiculoId: veiculoId ?? undefined,
      quilometragemEntrada: quilometragemEntrada ?? null,
      descricaoProblema: descricaoProblema ?? '',
      observacoes: observacoes ?? '',
      status: asStatusEditavel(status),
      agendada: !!dataAgendamentoInicio,
      dataAgendamentoInicio: isoParaDatetimeLocal(dataAgendamentoInicio),
    },
  })

  // Re-sincroniza o form quando o detalhe da OS mudar (após mutations).
  useEffect(() => {
    reset({
      veiculoId: veiculoId ?? undefined,
      quilometragemEntrada: quilometragemEntrada ?? null,
      descricaoProblema: descricaoProblema ?? '',
      observacoes: observacoes ?? '',
      status: asStatusEditavel(status),
      agendada: !!dataAgendamentoInicio,
      dataAgendamentoInicio: isoParaDatetimeLocal(dataAgendamentoInicio),
    })
  }, [
    veiculoId,
    quilometragemEntrada,
    descricaoProblema,
    observacoes,
    status,
    dataAgendamentoInicio,
    reset,
  ])

  const statusValue = watch('status')
  const agendada = watch('agendada')

  const onSubmit: SubmitHandler<AtualizarOrdemFormValues> = async (values) => {
    try {
      await atualizar.mutateAsync({ id: ordemId, values })
      toast.success('OS atualizada.')
      reset(values)
    } catch (err) {
      const apiErr = err as { message?: string }
      toast.error(apiErr.message ?? 'Não foi possível salvar.')
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-md border bg-card p-6"
      noValidate
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Dados da OS</h2>
        <p className="text-sm text-muted-foreground">
          Edição liberada apenas em status <strong>Aberta</strong>, <strong>Em andamento</strong>
          ou <strong>Aguardando produto</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={String(statusValue)}
            onValueChange={(v) =>
              setValue('status', Number(v) as StatusEditavel, { shouldDirty: true })
            }
            disabled={!editavel}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_EDITAVEIS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={String(s.value)}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="veiculo">Veículo</Label>
          <Controller
            control={control}
            name="veiculoId"
            render={({ field }) => (
              <VeiculoSelect
                clienteId={clienteId ?? undefined}
                value={field.value}
                onChange={field.onChange}
                disabled={!editavel}
              />
            )}
          />
          {errors.veiculoId && (
            <p role="alert" className="text-sm text-destructive">
              {errors.veiculoId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="quilometragemEntrada">Quilometragem de entrada</Label>
          <Input
            id="quilometragemEntrada"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            placeholder="Ex.: 45000"
            disabled={!editavel}
            aria-invalid={!!errors.quilometragemEntrada}
            {...register('quilometragemEntrada')}
          />
          {errors.quilometragemEntrada && (
            <p role="alert" className="text-sm text-destructive">
              {errors.quilometragemEntrada.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="agendada">OS agendada</Label>
            <Controller
              control={control}
              name="agendada"
              render={({ field }) => (
                <Switch
                  id="agendada"
                  checked={field.value ?? false}
                  disabled={!editavel}
                  onCheckedChange={(checked) => {
                    field.onChange(checked)
                    if (!checked) setValue('dataAgendamentoInicio', '', { shouldDirty: true })
                  }}
                />
              )}
            />
          </div>
          {agendada && (
            <>
              <Label htmlFor="dataAgendamentoInicio">Data e hora do agendamento</Label>
              <Input
                id="dataAgendamentoInicio"
                type="datetime-local"
                disabled={!editavel}
                aria-invalid={!!errors.dataAgendamentoInicio}
                {...register('dataAgendamentoInicio')}
              />
              {errors.dataAgendamentoInicio && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.dataAgendamentoInicio.message}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricaoProblema">Descrição do problema</Label>
        <Textarea
          id="descricaoProblema"
          rows={3}
          disabled={!editavel}
          aria-invalid={!!errors.descricaoProblema}
          {...register('descricaoProblema')}
        />
        {errors.descricaoProblema && (
          <p role="alert" className="text-sm text-destructive">
            {errors.descricaoProblema.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea
          id="observacoes"
          rows={3}
          disabled={!editavel}
          aria-invalid={!!errors.observacoes}
          {...register('observacoes')}
        />
        {errors.observacoes && (
          <p role="alert" className="text-sm text-destructive">
            {errors.observacoes.message}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!editavel || !isDirty || isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar alterações
        </Button>
      </div>
    </form>
  )
}
