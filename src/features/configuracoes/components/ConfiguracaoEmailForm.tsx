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
  configuracaoEmailSchema,
  type ConfiguracaoEmailFormValues,
} from '../helpers/configuracaoEmailSchema'
import { aplicarErrosValidacao, isValidationError } from '@/api/errors'
import type { ConfiguracaoEmailDto } from '../hooks/useObterConfiguracaoEmail'
import type { AtualizarConfiguracaoEmailDto } from '../hooks/useAtualizarConfiguracaoEmail'

interface Props {
  defaultValues: ConfiguracaoEmailDto
  onSubmit: (body: AtualizarConfiguracaoEmailDto) => Promise<void>
}

export function ConfiguracaoEmailForm({ defaultValues, onSubmit }: Props) {
  const [genericError, setGenericError] = useState<string | null>(null)
  const senhaDefinida = defaultValues.smtpSenhaDefinida === true

  const initial: ConfiguracaoEmailFormValues = {
    smtpHost: defaultValues.smtpHost ?? '',
    smtpPorta: defaultValues.smtpPorta ?? 587,
    smtpUsuario: defaultValues.smtpUsuario ?? '',
    smtpSenha: '',
    emailRemetente: defaultValues.emailRemetente ?? '',
    nomeRemetente: defaultValues.nomeRemetente ?? '',
    usarTls: defaultValues.usarTls ?? true,
    usarStub: defaultValues.usarStub ?? true,
    fallbackHabilitado: defaultValues.fallbackHabilitado ?? false,
  }

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ConfiguracaoEmailFormValues>({
    resolver: zodResolver(configuracaoEmailSchema),
    defaultValues: initial,
  })

  // Quando a query refetcha, sincroniza o form (senha sempre vazia).
  useEffect(() => {
    reset({
      smtpHost: defaultValues.smtpHost ?? '',
      smtpPorta: defaultValues.smtpPorta ?? 587,
      smtpUsuario: defaultValues.smtpUsuario ?? '',
      smtpSenha: '',
      emailRemetente: defaultValues.emailRemetente ?? '',
      nomeRemetente: defaultValues.nomeRemetente ?? '',
      usarTls: defaultValues.usarTls ?? true,
      usarStub: defaultValues.usarStub ?? true,
      fallbackHabilitado: defaultValues.fallbackHabilitado ?? false,
    })
  }, [
    reset,
    defaultValues.smtpHost,
    defaultValues.smtpPorta,
    defaultValues.smtpUsuario,
    defaultValues.emailRemetente,
    defaultValues.nomeRemetente,
    defaultValues.usarTls,
    defaultValues.usarStub,
    defaultValues.fallbackHabilitado,
  ])

  async function submit(values: ConfiguracaoEmailFormValues) {
    setGenericError(null)
    const senhaPreenchida = values.smtpSenha !== undefined && values.smtpSenha !== ''
    const body: AtualizarConfiguracaoEmailDto = {
      smtpHost: values.smtpHost,
      smtpPorta: values.smtpPorta,
      smtpUsuario: values.smtpUsuario,
      emailRemetente: values.emailRemetente,
      nomeRemetente: values.nomeRemetente,
      usarTls: values.usarTls,
      usarStub: values.usarStub,
      fallbackHabilitado: values.fallbackHabilitado,
      ...(senhaPreenchida ? { smtpSenha: values.smtpSenha as string } : {}),
    }
    try {
      await onSubmit(body)
      toast.success('Configuração de email atualizada.')
      reset({ ...values, smtpSenha: '' })
    } catch (err: unknown) {
      if (isValidationError(err)) {
        const naoAtribuidos = aplicarErrosValidacao<ConfiguracaoEmailFormValues>(err, setError)
        if (naoAtribuidos.length) toast.error(naoAtribuidos.join(' '))
      } else {
        const msg = err instanceof Error ? err.message : 'Não foi possível salvar a configuração.'
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
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="smtpHost">Servidor SMTP *</Label>
          <Input
            id="smtpHost"
            type="text"
            autoComplete="off"
            placeholder="smtp.gmail.com"
            aria-invalid={!!errors.smtpHost}
            {...register('smtpHost')}
          />
          {errors.smtpHost && (
            <p role="alert" className="text-sm text-destructive">
              {errors.smtpHost.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="smtpPorta">Porta *</Label>
          <Input
            id="smtpPorta"
            type="number"
            inputMode="numeric"
            aria-invalid={!!errors.smtpPorta}
            {...register('smtpPorta', { valueAsNumber: true })}
          />
          {errors.smtpPorta && (
            <p role="alert" className="text-sm text-destructive">
              {errors.smtpPorta.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="smtpUsuario">Usuário *</Label>
          <Input
            id="smtpUsuario"
            type="text"
            autoComplete="off"
            placeholder="user@example.com"
            aria-invalid={!!errors.smtpUsuario}
            {...register('smtpUsuario')}
          />
          {errors.smtpUsuario && (
            <p role="alert" className="text-sm text-destructive">
              {errors.smtpUsuario.message}
            </p>
          )}
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="smtpSenha">Senha</Label>
          <Input
            id="smtpSenha"
            type="password"
            autoComplete="new-password"
            placeholder={senhaDefinida ? '••••••••' : ''}
            aria-invalid={!!errors.smtpSenha}
            {...register('smtpSenha')}
          />
          <p className="text-xs text-muted-foreground">
            {senhaDefinida
              ? 'Senha definida (oculta). Deixe em branco para manter; preencha para substituir.'
              : 'Nenhuma senha definida. Preencha para configurar.'}
          </p>
          {errors.smtpSenha && (
            <p role="alert" className="text-sm text-destructive">
              {errors.smtpSenha.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="emailRemetente">E-mail remetente *</Label>
          <Input
            id="emailRemetente"
            type="email"
            autoComplete="off"
            placeholder="no-reply@suaoficina.com.br"
            aria-invalid={!!errors.emailRemetente}
            {...register('emailRemetente')}
          />
          {errors.emailRemetente && (
            <p role="alert" className="text-sm text-destructive">
              {errors.emailRemetente.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="nomeRemetente">Nome remetente *</Label>
          <Input
            id="nomeRemetente"
            type="text"
            autoComplete="off"
            placeholder="Sua Auto Elétrica"
            aria-invalid={!!errors.nomeRemetente}
            {...register('nomeRemetente')}
          />
          {errors.nomeRemetente && (
            <p role="alert" className="text-sm text-destructive">
              {errors.nomeRemetente.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <SwitchRow
          control={control}
          name="usarTls"
          label="STARTTLS (recomendado em produção)"
          description="Liga a negociação STARTTLS no servidor SMTP. Desligue só em servidores locais sem TLS (ex.: Mailtrap dev)."
        />
        <SwitchRow
          control={control}
          name="usarStub"
          label="Modo stub (desenvolvimento)"
          description="Quando ligado, e-mails são apenas logados — nada é entregue. Desligue em produção para enviar de verdade."
        />
        <SwitchRow
          control={control}
          name="fallbackHabilitado"
          label="Habilitar fallback do WhatsApp"
          description="Quando o envio via WhatsApp falhar ou o cliente não tiver WhatsApp, tenta entregar a cobrança por e-mail."
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

interface SwitchRowProps {
  control: ReturnType<typeof useForm<ConfiguracaoEmailFormValues>>['control']
  name: 'usarTls' | 'usarStub' | 'fallbackHabilitado'
  label: string
  description: string
}

function SwitchRow({ control, name, label, description }: SwitchRowProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border p-3">
      <div className="space-y-0.5">
        <Label htmlFor={name} className="cursor-pointer">
          {label}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Switch
            id={name}
            aria-label={label}
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />
    </div>
  )
}
