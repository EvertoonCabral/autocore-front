import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/shared/components/PageHeader'
import {
  CONFIG_KEYS,
  configuracoesFormSchema,
  type ConfiguracoesFormValues,
} from '../helpers/configuracaoSchema'
import { useListarConfiguracoes } from '../hooks/useListarConfiguracoes'
import { useAtualizarConfiguracao } from '../hooks/useAtualizarConfiguracao'
import { MensagemPreview } from '../components/MensagemPreview'

const EMPTY_DEFAULTS: ConfiguracoesFormValues = {
  diasParaCobranca: 5,
  mensagemCobranca: '',
  precosAtualizadosEm: '',
}

export function ConfiguracoesPage() {
  const { data: configuracoes, isLoading, isError } = useListarConfiguracoes()
  const atualizar = useAtualizarConfiguracao()

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<ConfiguracoesFormValues>({
    resolver: zodResolver(configuracoesFormSchema),
    defaultValues: EMPTY_DEFAULTS,
  })

  // Hidrata o form quando a lista chega
  useEffect(() => {
    if (!configuracoes) return
    const lookup = new Map(configuracoes.map((c) => [c.chave, c.valor]))
    reset({
      diasParaCobranca: Number(lookup.get(CONFIG_KEYS.DiasParaCobranca) ?? 5),
      mensagemCobranca: lookup.get(CONFIG_KEYS.MensagemCobranca) ?? '',
      precosAtualizadosEm: lookup.get(CONFIG_KEYS.PrecosAtualizadosEm) ?? '',
    })
  }, [configuracoes, reset])

  const mensagemAtual = watch('mensagemCobranca') ?? ''

  async function onSubmit(values: ConfiguracoesFormValues) {
    // Submete apenas os campos modificados — cada chave tem endpoint próprio.
    const ops: Array<Promise<unknown>> = []
    if (dirtyFields.diasParaCobranca) {
      ops.push(
        atualizar.mutateAsync({
          chave: CONFIG_KEYS.DiasParaCobranca,
          valor: String(values.diasParaCobranca),
        }),
      )
    }
    if (dirtyFields.mensagemCobranca) {
      ops.push(
        atualizar.mutateAsync({
          chave: CONFIG_KEYS.MensagemCobranca,
          valor: values.mensagemCobranca,
        }),
      )
    }
    if (dirtyFields.precosAtualizadosEm) {
      ops.push(
        atualizar.mutateAsync({
          chave: CONFIG_KEYS.PrecosAtualizadosEm,
          valor: values.precosAtualizadosEm,
        }),
      )
    }

    if (ops.length === 0) {
      toast.message('Nenhuma alteração para salvar.')
      return
    }

    try {
      await Promise.all(ops)
      toast.success(
        ops.length === 1 ? 'Configuração atualizada.' : `${ops.length} configurações atualizadas.`,
      )
      // Reset com os valores atuais para zerar isDirty
      reset(values)
    } catch (err) {
      const apiErr = err as { message?: string }
      toast.error(apiErr.message ?? 'Não foi possível salvar as configurações.')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full max-w-3xl" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="space-y-3">
        <PageHeader title="Configurações" />
        <p className="text-sm text-destructive">Não foi possível carregar as configurações.</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Configurações"
        description="Parâmetros do sistema que podem ser ajustados sem deploy. Restrito ao Admin."
      />

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-3xl space-y-6 rounded-md border bg-card p-6"
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="diasParaCobranca">Dias para cobrança *</Label>
          <Input
            id="diasParaCobranca"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            className="w-32"
            aria-invalid={!!errors.diasParaCobranca}
            {...register('diasParaCobranca')}
          />
          <p className="text-xs text-muted-foreground">
            Quantos dias somar à data de fechamento da OS para definir o vencimento do
            pagamento. Default usado pelo back se ausente: <code className="rounded bg-muted px-1">5</code>.
          </p>
          {errors.diasParaCobranca && (
            <p role="alert" className="text-sm text-destructive">
              {errors.diasParaCobranca.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="mensagemCobranca">Mensagem de cobrança *</Label>
          <Textarea
            id="mensagemCobranca"
            rows={6}
            placeholder="Olá {Cliente}, identificamos uma pendência na sua OS {Numero}…"
            aria-invalid={!!errors.mensagemCobranca}
            {...register('mensagemCobranca')}
          />
          <p className="text-xs text-muted-foreground">
            Template do WhatsApp. Placeholders disponíveis:{' '}
            <code className="rounded bg-muted px-1">{'{Cliente}'}</code>,{' '}
            <code className="rounded bg-muted px-1">{'{Numero}'}</code>,{' '}
            <code className="rounded bg-muted px-1">{'{Valor}'}</code>,{' '}
            <code className="rounded bg-muted px-1">{'{Vencimento}'}</code>. Vazio = usa o
            template embutido no back.
          </p>
          {errors.mensagemCobranca && (
            <p role="alert" className="text-sm text-destructive">
              {errors.mensagemCobranca.message}
            </p>
          )}
        </div>

        <MensagemPreview template={mensagemAtual} />

        <div className="space-y-2">
          <Label htmlFor="precosAtualizadosEm">Preços atualizados em</Label>
          <Input
            id="precosAtualizadosEm"
            placeholder="2024-07-20T10:30:00Z (ou vazio)"
            aria-invalid={!!errors.precosAtualizadosEm}
            {...register('precosAtualizadosEm')}
          />
          <p className="text-xs text-muted-foreground">
            Campo de auditoria. Marque manualmente após atualizar preços do catálogo em massa.
            ISO-8601 ou vazio.
          </p>
          {errors.precosAtualizadosEm && (
            <p role="alert" className="text-sm text-destructive">
              {errors.precosAtualizadosEm.message}
            </p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar alterações
          </Button>
        </div>
      </form>
    </div>
  )
}
