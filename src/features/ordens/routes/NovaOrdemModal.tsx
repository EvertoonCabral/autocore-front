import { useNavigate } from 'react-router-dom'
import { useForm, Controller, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ClienteSelect } from '@/features/clientes/components/ClienteSelect'
import { VeiculoSelect } from '@/features/veiculos/components/VeiculoSelect'
import { aplicarErrosValidacao, isValidationError } from '@/api/errors'
import { abrirOrdemSchema, type AbrirOrdemFormValues } from '../helpers/ordemSchemas'
import { useAbrirOrdem } from '../hooks/useAbrirOrdem'
import { ClienteResumoCard } from '../components/ClienteResumoCard'

/**
 * Modal (Dialog) de Abrir OS em 2 colunas sobre a lista de ordens. A URL é
 * `/ordens/nova` (deep-linkável); a lista permanece montada atrás.
 * Esquerda: "Quem e qual carro" (Cliente → Veículo + saldo do cliente).
 * Direita: "O problema" (descrição/observações). Reusa `useAbrirOrdem`.
 */
export function NovaOrdemModal() {
  const navigate = useNavigate()
  const abrir = useAbrirOrdem()

  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AbrirOrdemFormValues>({
    resolver: zodResolver(abrirOrdemSchema),
    defaultValues: { descricaoProblema: '', observacoes: '' } as Partial<AbrirOrdemFormValues>,
  })

  const clienteSelecionado = watch('clienteId')

  const fechar = () => navigate('/ordens')

  const onSubmit: SubmitHandler<AbrirOrdemFormValues> = async (values) => {
    try {
      const { id } = await abrir.mutateAsync(values)
      toast.success('Ordem de serviço aberta.')
      navigate(`/ordens/${id}`, { replace: true })
    } catch (err) {
      if (isValidationError(err)) {
        const naoAtribuidos = aplicarErrosValidacao<AbrirOrdemFormValues>(err, setError)
        if (naoAtribuidos.length) toast.error(naoAtribuidos.join(' '))
        return
      }
      toast.error(err instanceof Error ? err.message : 'Não foi possível abrir a OS.')
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) fechar()
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Abrir nova OS</DialogTitle>
          <DialogDescription>Selecione o cliente e descreva o problema.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Coluna esquerda: quem e qual carro */}
            <div className="space-y-4">
              <p className="text-sm font-semibold text-foreground">Quem e qual carro</p>

              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente *</Label>
                <Controller
                  control={control}
                  name="clienteId"
                  render={({ field }) => (
                    <ClienteSelect
                      value={field.value}
                      onChange={(clienteId) => {
                        field.onChange(clienteId)
                        // Trocar de cliente invalida o veículo escolhido.
                        setValue('veiculoId', undefined)
                      }}
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">Apenas clientes ativos podem abrir OS.</p>
                {errors.clienteId && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.clienteId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="veiculo">Veículo</Label>
                <Controller
                  control={control}
                  name="veiculoId"
                  render={({ field }) => (
                    <VeiculoSelect
                      clienteId={clienteSelecionado}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Opcional. Selecione o cliente primeiro para listar os veículos dele.
                </p>
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
                  aria-invalid={!!errors.quilometragemEntrada}
                  {...register('quilometragemEntrada')}
                />
                <p className="text-xs text-muted-foreground">
                  Opcional. KM do odômetro na entrada do veículo.
                </p>
                {errors.quilometragemEntrada && (
                  <p role="alert" className="text-sm text-destructive">
                    {errors.quilometragemEntrada.message}
                  </p>
                )}
              </div>

              <ClienteResumoCard clienteId={clienteSelecionado} />
            </div>

            {/* Coluna direita: o problema */}
            <div className="space-y-4">
              <p className="text-sm font-semibold text-foreground">O problema</p>

              <div className="space-y-2">
                <Label htmlFor="descricaoProblema">Descrição do problema</Label>
                <Textarea
                  id="descricaoProblema"
                  rows={5}
                  placeholder="O que o cliente relatou…"
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
                <Label htmlFor="observacoes">Observações internas</Label>
                <Textarea
                  id="observacoes"
                  rows={4}
                  placeholder="Notas internas, peças necessárias…"
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={fechar} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Abrir OS
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
