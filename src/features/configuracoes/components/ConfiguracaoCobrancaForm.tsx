import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  configuracaoCobrancaSchema,
  type ConfiguracaoCobrancaFormValues,
} from '../helpers/configuracaoCobrancaSchema'
import type {
  ConfiguracaoCobrancaDto,
} from '../hooks/useObterConfiguracaoCobranca'
import type { AtualizarConfiguracaoCobrancaDto } from '../hooks/useAtualizarConfiguracaoCobranca'

interface Props {
  defaultValues: ConfiguracaoCobrancaDto
  onSubmit: (body: AtualizarConfiguracaoCobrancaDto) => Promise<void>
}

export function ConfiguracaoCobrancaForm({ defaultValues, onSubmit }: Props) {
  const [genericError, setGenericError] = useState<string | null>(null)

  const apiKeyDefinida = defaultValues.apiKeyDefinida === true

  const initial: ConfiguracaoCobrancaFormValues = {
    baseUrl: defaultValues.baseUrl ?? '',
    apiKey: '',
    instancia: defaultValues.instancia ?? '',
    usarStub: defaultValues.usarStub ?? false,
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ConfiguracaoCobrancaFormValues>({
    resolver: zodResolver(configuracaoCobrancaSchema),
    defaultValues: initial,
  })

  // Quando a query refetcha, sincroniza o form (sem o apiKey, que é sempre vazio).
  useEffect(() => {
    reset({
      baseUrl: defaultValues.baseUrl ?? '',
      apiKey: '',
      instancia: defaultValues.instancia ?? '',
      usarStub: defaultValues.usarStub ?? false,
    })
  }, [reset, defaultValues.baseUrl, defaultValues.instancia, defaultValues.usarStub])

  async function submit(values: ConfiguracaoCobrancaFormValues) {
    setGenericError(null)
    const apiKeyPreenchida = values.apiKey !== undefined && values.apiKey !== ''
    const body: AtualizarConfiguracaoCobrancaDto = {
      baseUrl: values.baseUrl,
      instancia: values.instancia,
      usarStub: values.usarStub,
      ...(apiKeyPreenchida ? { apiKey: values.apiKey as string } : {}),
    }
    try {
      await onSubmit(body)
      toast.success('Configuração atualizada.')
      // Reset com os novos valores; apiKey volta a ficar vazia.
      reset({
        baseUrl: values.baseUrl,
        apiKey: '',
        instancia: values.instancia,
        usarStub: values.usarStub,
      })
    } catch (err: unknown) {
      const apiErr = err as { kind?: string; message?: string; detalhes?: string[] }
      if (apiErr.kind === 'validation' && apiErr.detalhes && apiErr.detalhes.length > 0) {
        let distributed = false
        for (const detalhe of apiErr.detalhes) {
          if (/baseurl|url/i.test(detalhe)) {
            setError('baseUrl', { message: detalhe })
            distributed = true
          } else if (/apikey|chave/i.test(detalhe)) {
            setError('apiKey', { message: detalhe })
            distributed = true
          } else if (/inst[âa]ncia/i.test(detalhe)) {
            setError('instancia', { message: detalhe })
            distributed = true
          }
        }
        if (!distributed) {
          toast.error(apiErr.detalhes.join(' '))
        }
      } else {
        const msg = apiErr.message ?? 'Não foi possível salvar a configuração.'
        setGenericError(msg)
        toast.error(msg)
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="max-w-3xl space-y-6 rounded-md border bg-card p-6"
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="baseUrl">URL base da Evolution *</Label>
        <Input
          id="baseUrl"
          type="text"
          autoComplete="off"
          placeholder="http://localhost:8080"
          aria-invalid={!!errors.baseUrl}
          {...register('baseUrl')}
        />
        <p className="text-xs text-muted-foreground">
          Endereço da API da Evolution. Em produção, use uma URL HTTPS.
        </p>
        {errors.baseUrl && (
          <p role="alert" className="text-sm text-destructive">
            {errors.baseUrl.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="apiKey">API Key da Evolution</Label>
        <Input
          id="apiKey"
          type="password"
          autoComplete="new-password"
          placeholder={apiKeyDefinida ? '••••••••' : ''}
          aria-invalid={!!errors.apiKey}
          {...register('apiKey')}
        />
        <p className="text-xs text-muted-foreground">
          {apiKeyDefinida
            ? 'Definida (oculta). Deixe em branco para manter; preencha para substituir.'
            : 'Nenhuma chave definida. Preencha para configurar.'}
        </p>
        {errors.apiKey && (
          <p role="alert" className="text-sm text-destructive">
            {errors.apiKey.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="instancia">Instância *</Label>
        <Input
          id="instancia"
          type="text"
          autoComplete="off"
          placeholder="autocore"
          aria-invalid={!!errors.instancia}
          {...register('instancia')}
        />
        <p className="text-xs text-muted-foreground">
          Nome da instância configurada na Evolution.
        </p>
        {errors.instancia && (
          <p role="alert" className="text-sm text-destructive">
            {errors.instancia.message}
          </p>
        )}
      </div>

      <div className="flex items-start justify-between gap-3 rounded-md border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="usarStub" className="cursor-pointer">
            Modo stub (desenvolvimento)
          </Label>
          <p className="text-xs text-muted-foreground">
            Quando ligado, cobranças são apenas logadas — nada é enviado para o
            WhatsApp real. Desligue em produção para enviar mensagens de verdade.
          </p>
        </div>
        <Controller
          control={control}
          name="usarStub"
          render={({ field }) => (
            <Switch
              id="usarStub"
              aria-label="Modo stub"
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </div>

      {genericError && (
        <p role="alert" className="text-sm text-destructive">
          {genericError}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={!isDirty || isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </Button>
      </div>
    </form>
  )
}
