import { Link, useNavigate } from 'react-router-dom'
import { useForm, Controller, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/shared/components/PageHeader'
import { ClienteSelect } from '@/features/clientes/components/ClienteSelect'
import { aplicarErrosValidacao, isValidationError } from '@/api/errors'
import { abrirOrdemSchema, type AbrirOrdemFormValues } from '../helpers/ordemSchemas'
import { useAbrirOrdem } from '../hooks/useAbrirOrdem'

export function NovaOrdemPage() {
  const navigate = useNavigate()
  const abrir = useAbrirOrdem()

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AbrirOrdemFormValues>({
    resolver: zodResolver(abrirOrdemSchema),
    defaultValues: { descricaoProblema: '', observacoes: '' } as Partial<AbrirOrdemFormValues>,
  })

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
    <div className="space-y-5">
      <PageHeader
        title="Abrir nova OS"
        description="Selecione o cliente e descreva o problema."
        actions={
          <Button asChild variant="outline">
            <Link to="/ordens">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-5 rounded-md border bg-card p-6" noValidate>
        <div className="space-y-2">
          <Label htmlFor="cliente">Cliente *</Label>
          <Controller
            control={control}
            name="clienteId"
            render={({ field }) => (
              <ClienteSelect value={field.value} onChange={field.onChange} />
            )}
          />
          <p className="text-xs text-muted-foreground">
            Apenas clientes ativos podem abrir OS.
          </p>
          {errors.clienteId && (
            <p role="alert" className="text-sm text-destructive">
              {errors.clienteId.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="descricaoProblema">Descrição do problema</Label>
          <Textarea
            id="descricaoProblema"
            rows={4}
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
            rows={3}
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

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate('/ordens')} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Abrir OS
          </Button>
        </div>
      </form>
    </div>
  )
}
