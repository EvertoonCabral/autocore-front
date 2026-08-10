import { useEffect, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Copy, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { aplicarErrosValidacao, isValidationError } from '@/api/errors'
import {
  configuracaoPagamentoSchema,
  type ConfiguracaoPagamentoFormValues,
} from '../helpers/configuracaoPagamentoSchema'
import type { ConfiguracaoPagamentoDto } from '../hooks/useObterConfiguracaoPagamento'
import type { AtualizarConfiguracaoPagamentoDto } from '../hooks/useAtualizarConfiguracaoPagamento'

interface Props {
  defaultValues: ConfiguracaoPagamentoDto
  onSubmit: (body: AtualizarConfiguracaoPagamentoDto) => Promise<void>
}

function toInitial(d: ConfiguracaoPagamentoDto): ConfiguracaoPagamentoFormValues {
  return {
    accessToken: '',
    webhookSecret: '',
    publicKey: d.publicKey ?? '',
    ambiente: (d.ambiente ?? 1) as 1 | 2,
    usarStub: d.usarStub ?? true,
    baseUrlPublica: d.baseUrlPublica ?? '',
    emailFallbackPagador: d.emailFallbackPagador ?? '',
    pixExpiraMinutosBancada: d.pixExpiraMinutosBancada ?? 30,
    pixExpiraMinutosRemoto: d.pixExpiraMinutosRemoto ?? 30,
    repassarTaxa: d.repassarTaxa ?? true,
    taxaPixPercentual: d.taxaPixPercentual ?? 0,
    taxaCartaoPercentual: d.taxaCartaoPercentual ?? 0,
    jurosParcelamentoAoCliente: d.jurosParcelamentoAoCliente ?? true,
    parcelasMaximas: d.parcelasMaximas ?? 12,
    boletoHabilitado: d.boletoHabilitado ?? false,
  }
}

export function ConfiguracaoPagamentoForm({ defaultValues, onSubmit }: Props) {
  const [genericError, setGenericError] = useState<string | null>(null)

  const accessTokenDefinido = defaultValues.accessTokenDefinido === true
  const webhookSecretDefinido = defaultValues.webhookSecretDefinido === true

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ConfiguracaoPagamentoFormValues>({
    resolver: zodResolver(configuracaoPagamentoSchema),
    defaultValues: toInitial(defaultValues),
  })

  useEffect(() => {
    reset(toInitial(defaultValues))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    reset,
    defaultValues.publicKey,
    defaultValues.ambiente,
    defaultValues.usarStub,
    defaultValues.baseUrlPublica,
    defaultValues.emailFallbackPagador,
    defaultValues.pixExpiraMinutosBancada,
    defaultValues.pixExpiraMinutosRemoto,
    defaultValues.repassarTaxa,
    defaultValues.taxaPixPercentual,
    defaultValues.taxaCartaoPercentual,
    defaultValues.jurosParcelamentoAoCliente,
    defaultValues.parcelasMaximas,
    defaultValues.boletoHabilitado,
  ])

  const repassarTaxa = watch('repassarTaxa')
  const baseUrlSalva = defaultValues.baseUrlPublica ?? ''
  const webhookUrl = baseUrlSalva ? `${baseUrlSalva.replace(/\/$/, '')}/api/webhooks/mercadopago` : ''

  async function copiarWebhook() {
    if (!webhookUrl) return
    try {
      await navigator.clipboard.writeText(webhookUrl)
      toast.success('URL do webhook copiada.')
    } catch {
      toast.error('Não foi possível copiar.')
    }
  }

  async function submit(values: ConfiguracaoPagamentoFormValues) {
    setGenericError(null)
    const body: AtualizarConfiguracaoPagamentoDto = {
      publicKey: values.publicKey,
      ambiente: values.ambiente,
      usarStub: values.usarStub,
      baseUrlPublica: values.baseUrlPublica,
      emailFallbackPagador: values.emailFallbackPagador,
      pixExpiraMinutosBancada: values.pixExpiraMinutosBancada,
      pixExpiraMinutosRemoto: values.pixExpiraMinutosRemoto,
      repassarTaxa: values.repassarTaxa,
      taxaPixPercentual: values.taxaPixPercentual,
      taxaCartaoPercentual: values.taxaCartaoPercentual,
      jurosParcelamentoAoCliente: values.jurosParcelamentoAoCliente,
      parcelasMaximas: values.parcelasMaximas,
      boletoHabilitado: values.boletoHabilitado,
      // Segredos: só enviamos se preenchidos (vazio = manter no back).
      ...(values.accessToken ? { accessToken: values.accessToken } : {}),
      ...(values.webhookSecret ? { webhookSecret: values.webhookSecret } : {}),
    }
    try {
      await onSubmit(body)
      toast.success('Configuração de pagamento atualizada.')
      reset({ ...values, accessToken: '', webhookSecret: '' })
    } catch (err: unknown) {
      if (isValidationError(err)) {
        const naoAtribuidos = aplicarErrosValidacao<ConfiguracaoPagamentoFormValues>(err, setError)
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
      {/* ─── Credenciais ─────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Credenciais</h3>

        <div className="space-y-2">
          <Label htmlFor="accessToken">Access Token</Label>
          <Input
            id="accessToken"
            type="password"
            autoComplete="new-password"
            placeholder={accessTokenDefinido ? '••••••••' : 'APP_USR-...'}
            aria-invalid={!!errors.accessToken}
            {...register('accessToken')}
          />
          <p className="text-xs text-muted-foreground">
            {accessTokenDefinido
              ? 'Definido (oculto). Deixe em branco para manter; preencha para substituir.'
              : 'Nenhum token definido. Cole o access token do painel do Mercado Pago.'}
          </p>
          {errors.accessToken && (
            <p role="alert" className="text-sm text-destructive">
              {errors.accessToken.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="publicKey">Public Key</Label>
          <Input
            id="publicKey"
            type="text"
            autoComplete="off"
            placeholder="APP_USR-..."
            aria-invalid={!!errors.publicKey}
            {...register('publicKey')}
          />
          {errors.publicKey && (
            <p role="alert" className="text-sm text-destructive">
              {errors.publicKey.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="webhookSecret">Webhook Secret</Label>
          <Input
            id="webhookSecret"
            type="password"
            autoComplete="new-password"
            placeholder={webhookSecretDefinido ? '••••••••' : ''}
            aria-invalid={!!errors.webhookSecret}
            {...register('webhookSecret')}
          />
          <p className="text-xs text-muted-foreground">
            {webhookSecretDefinido
              ? 'Definido (oculto). Deixe em branco para manter; preencha para substituir.'
              : 'Assinatura das notificações. Copie do painel do Mercado Pago.'}
          </p>
          {errors.webhookSecret && (
            <p role="alert" className="text-sm text-destructive">
              {errors.webhookSecret.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="ambiente">Ambiente</Label>
          <Controller
            control={control}
            name="ambiente"
            render={({ field }) => (
              <Select
                value={String(field.value)}
                onValueChange={(v) => field.onChange(Number(v) as 1 | 2)}
              >
                <SelectTrigger id="ambiente" className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Sandbox (teste)</SelectItem>
                  <SelectItem value="2">Produção</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="border-t" />

      {/* ─── Operação ────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Operação</h3>

        <div className="flex items-start justify-between gap-3 rounded-md border p-3">
          <div className="space-y-0.5">
            <Label htmlFor="usarStub" className="cursor-pointer">
              Modo stub (desenvolvimento)
            </Label>
            <p className="text-xs text-muted-foreground">
              Quando ligado, cobranças online são simuladas — nenhuma chamada real ao Mercado
              Pago. Desligue em produção para movimentar dinheiro de verdade.
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

        <div className="space-y-2">
          <Label htmlFor="baseUrlPublica">URL pública base</Label>
          <Input
            id="baseUrlPublica"
            type="text"
            autoComplete="off"
            placeholder="https://autocore.suaempresa.com.br"
            aria-invalid={!!errors.baseUrlPublica}
            {...register('baseUrlPublica')}
          />
          <p className="text-xs text-muted-foreground">
            Base HTTPS pública usada no webhook e nos retornos do checkout. Necessária fora do
            modo stub.
          </p>
          {errors.baseUrlPublica && (
            <p role="alert" className="text-sm text-destructive">
              {errors.baseUrlPublica.message}
            </p>
          )}
        </div>

        {/* URL do webhook (read-only) para colar no painel do Mercado Pago */}
        <div className="space-y-2">
          <Label htmlFor="webhookUrl">URL do webhook (cole no painel do Mercado Pago)</Label>
          <div className="flex gap-2">
            <Input
              id="webhookUrl"
              type="text"
              readOnly
              value={webhookUrl || '— defina a URL pública base e salve —'}
              className="font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={copiarWebhook}
              disabled={!webhookUrl}
              aria-label="Copiar URL do webhook"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="emailFallbackPagador">E-mail de fallback do pagador</Label>
          <Input
            id="emailFallbackPagador"
            type="email"
            autoComplete="off"
            placeholder="pagamentos@suaempresa.com.br"
            aria-invalid={!!errors.emailFallbackPagador}
            {...register('emailFallbackPagador')}
          />
          <p className="text-xs text-muted-foreground">
            Usado quando o cliente não tem e-mail cadastrado (o Mercado Pago exige um e-mail de
            pagador).
          </p>
          {errors.emailFallbackPagador && (
            <p role="alert" className="text-sm text-destructive">
              {errors.emailFallbackPagador.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pixExpiraMinutosBancada">Validade do Pix na bancada (min)</Label>
            <Input
              id="pixExpiraMinutosBancada"
              type="number"
              min={1}
              step={1}
              aria-invalid={!!errors.pixExpiraMinutosBancada}
              {...register('pixExpiraMinutosBancada')}
            />
            {errors.pixExpiraMinutosBancada && (
              <p role="alert" className="text-sm text-destructive">
                {errors.pixExpiraMinutosBancada.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="pixExpiraMinutosRemoto">Validade do Pix remoto (min)</Label>
            <Input
              id="pixExpiraMinutosRemoto"
              type="number"
              min={1}
              step={1}
              aria-invalid={!!errors.pixExpiraMinutosRemoto}
              {...register('pixExpiraMinutosRemoto')}
            />
            <p className="text-xs text-muted-foreground">
              Vale para o Pix enviado por WhatsApp/e-mail — a mensagem informa esta validade.
            </p>
            {errors.pixExpiraMinutosRemoto && (
              <p role="alert" className="text-sm text-destructive">
                {errors.pixExpiraMinutosRemoto.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t" />

      {/* ─── Taxas ───────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Taxas</h3>

        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
          As taxas abaixo são <strong>digitadas</strong> — o Mercado Pago não expõe a taxa
          negociada da sua conta por API. Consulte seu extrato/contrato do MP e mantenha estes
          valores atualizados após qualquer renegociação.
        </p>

        <div className="flex items-start justify-between gap-3 rounded-md border p-3">
          <div className="space-y-0.5">
            <Label htmlFor="repassarTaxa" className="cursor-pointer">
              Repassar taxa ao cliente
            </Label>
            <p className="text-xs text-muted-foreground">
              Quando ligado, o valor cobrado é acrescido para que a oficina receba o valor da OS
              líquido. O acréscimo aparece discriminado na cobrança.
            </p>
          </div>
          <Controller
            control={control}
            name="repassarTaxa"
            render={({ field }) => (
              <Switch
                id="repassarTaxa"
                aria-label="Repassar taxa ao cliente"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="taxaPixPercentual">Taxa Pix (%)</Label>
            <Input
              id="taxaPixPercentual"
              type="number"
              min={0}
              step="0.001"
              inputMode="decimal"
              disabled={!repassarTaxa}
              aria-invalid={!!errors.taxaPixPercentual}
              {...register('taxaPixPercentual')}
            />
            {errors.taxaPixPercentual && (
              <p role="alert" className="text-sm text-destructive">
                {errors.taxaPixPercentual.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="taxaCartaoPercentual">Taxa cartão (%)</Label>
            <Input
              id="taxaCartaoPercentual"
              type="number"
              min={0}
              step="0.001"
              inputMode="decimal"
              disabled={!repassarTaxa}
              aria-invalid={!!errors.taxaCartaoPercentual}
              {...register('taxaCartaoPercentual')}
            />
            {errors.taxaCartaoPercentual && (
              <p role="alert" className="text-sm text-destructive">
                {errors.taxaCartaoPercentual.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start justify-between gap-3 rounded-md border p-3">
          <div className="space-y-0.5">
            <Label htmlFor="jurosParcelamentoAoCliente" className="cursor-pointer">
              Juros de parcelamento por conta do cliente
            </Label>
            <p className="text-xs text-muted-foreground">
              No checkout de cartão, quem paga os juros das parcelas é o cliente (não a oficina).
            </p>
          </div>
          <Controller
            control={control}
            name="jurosParcelamentoAoCliente"
            render={({ field }) => (
              <Switch
                id="jurosParcelamentoAoCliente"
                aria-label="Juros de parcelamento por conta do cliente"
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      <div className="border-t" />

      {/* ─── Checkout ────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Checkout</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="parcelasMaximas">Parcelas máximas</Label>
            <Input
              id="parcelasMaximas"
              type="number"
              min={1}
              max={24}
              step={1}
              aria-invalid={!!errors.parcelasMaximas}
              {...register('parcelasMaximas')}
            />
            {errors.parcelasMaximas && (
              <p role="alert" className="text-sm text-destructive">
                {errors.parcelasMaximas.message}
              </p>
            )}
          </div>
          <div className="flex items-start justify-between gap-3 rounded-md border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="boletoHabilitado" className="cursor-pointer">
                Habilitar boleto
              </Label>
              <p className="text-xs text-muted-foreground">
                Oferece boleto como meio de pagamento no checkout.
              </p>
            </div>
            <Controller
              control={control}
              name="boletoHabilitado"
              render={({ field }) => (
                <Switch
                  id="boletoHabilitado"
                  aria-label="Habilitar boleto"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </div>
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
