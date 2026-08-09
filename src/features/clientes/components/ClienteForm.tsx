import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { aplicarErrosValidacao } from '@/api/errors'
import { formatCpfCnpj, maskTelefoneInput } from '@/lib/format'
import { clienteSchema, type ClienteFormValues } from '../helpers/clienteSchema'
import { useBuscaCep } from '../hooks/useBuscaCep'

interface ClienteFormProps {
  /** Valores iniciais (em modo edição). */
  defaultValues?: Partial<ClienteFormValues>
  submitLabel?: string
  onSubmit: (values: ClienteFormValues) => Promise<void>
  /** Disparado pelo botão Cancelar. */
  onCancel?: () => void
  /** Notifica quando o form fica "sujo" (usado pelo drawer para confirmar descarte). */
  onDirtyChange?: (dirty: boolean) => void
}

export function ClienteForm({
  defaultValues,
  submitLabel = 'Salvar',
  onSubmit,
  onCancel,
  onDirtyChange,
}: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    clearErrors,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: '',
      telefone: '',
      segundoTelefone: '',
      email: '',
      cpfCnpj: '',
      cep: '',
      logradouro: '',
      numero: '',
      bairro: '',
      cidade: '',
      uf: '',
      observacoes: '',
      ...defaultValues,
    },
  })

  // Atualiza o form quando defaultValues chegam tarde (modo edição com fetch).
  useEffect(() => {
    if (defaultValues) {
      reset({
        nome: defaultValues.nome ?? '',
        telefone: maskTelefoneInput(defaultValues.telefone ?? ''),
        segundoTelefone: maskTelefoneInput(defaultValues.segundoTelefone ?? ''),
        email: defaultValues.email ?? '',
        cpfCnpj: formatCpfCnpj(defaultValues.cpfCnpj ?? ''),
        cep: defaultValues.cep ?? '',
        logradouro: defaultValues.logradouro ?? '',
        numero: defaultValues.numero ?? '',
        bairro: defaultValues.bairro ?? '',
        cidade: defaultValues.cidade ?? '',
        uf: defaultValues.uf ?? '',
        observacoes: defaultValues.observacoes ?? '',
      })
    }
  }, [defaultValues, reset])

  // Espelha o estado "sujo" pro caller (drawer usa pra confirmar descarte).
  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  const { buscar: buscarCep, carregando: buscandoCep } = useBuscaCep()

  // A busca de CEP é **explícita**: só dispara pelo botão de busca ou ao
  // pressionar Enter no campo CEP (não automaticamente ao digitar/sair). Ao
  // encontrar, preenche logradouro/bairro/cidade/uf — o `numero` nunca é
  // sobrescrito e todos os campos seguem editáveis. Falha de rede é silenciosa;
  // CEP inexistente (ou incompleto) mostra uma mensagem gentil no próprio campo.
  const cepReg = register('cep')
  async function buscarCepAtual() {
    const valor = getValues('cep') ?? ''
    if (valor.replace(/\D/g, '').length !== 8) {
      setError('cep', { type: 'manual', message: 'Informe um CEP com 8 dígitos para buscar.' })
      return
    }
    const resultado = await buscarCep(valor)
    if (resultado.status === 'ok') {
      clearErrors('cep')
      const { logradouro, bairro, cidade, uf } = resultado.endereco
      const opts = { shouldDirty: true, shouldValidate: true }
      if (logradouro) setValue('logradouro', logradouro, opts)
      if (bairro) setValue('bairro', bairro, opts)
      if (cidade) setValue('cidade', cidade, opts)
      if (uf) setValue('uf', uf, opts)
    } else if (resultado.status === 'nao-encontrado') {
      setError('cep', {
        type: 'manual',
        message: 'CEP não encontrado. Preencha o endereço manualmente.',
      })
    }
    // 'erro-rede': silencioso — o usuário preenche manualmente.
  }

  async function submit(values: ClienteFormValues) {
    // Schema (clienteSchema) já remove a máscara via .transform — values
    // chegam aqui com telefone/cpfCnpj só-dígitos.
    try {
      await onSubmit(values)
    } catch (err: unknown) {
      // O back envia `campo` em camelCase igual aos nomes deste form, então
      // o helper distribui direto; sobras (campo desconhecido) viram toast.
      const naoAtribuidos = aplicarErrosValidacao<ClienteFormValues>(err, setError)
      if (naoAtribuidos.length) toast.error(naoAtribuidos.join(' '))
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input id="nome" autoComplete="name" aria-invalid={!!errors.nome} {...register('nome')} />
          {errors.nome && (
            <p role="alert" className="text-sm text-destructive">
              {errors.nome.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone *</Label>
          <Controller
            control={control}
            name="telefone"
            render={({ field }) => (
              <Input
                id="telefone"
                inputMode="tel"
                autoComplete="tel"
                placeholder="(44) 99999-0000"
                aria-invalid={!!errors.telefone}
                value={maskTelefoneInput(field.value)}
                onChange={(e) => field.onChange(maskTelefoneInput(e.target.value))}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
          <p className="text-xs text-muted-foreground">
            DDD + número (10 a 11 dígitos). Aplicação remove a máscara antes de enviar.
          </p>
          {errors.telefone && (
            <p role="alert" className="text-sm text-destructive">
              {errors.telefone.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="segundoTelefone">Telefone secundário</Label>
          <Controller
            control={control}
            name="segundoTelefone"
            render={({ field }) => (
              <Input
                id="segundoTelefone"
                inputMode="tel"
                autoComplete="tel"
                placeholder="(44) 3333-0000"
                aria-invalid={!!errors.segundoTelefone}
                value={maskTelefoneInput(field.value ?? '')}
                onChange={(e) => field.onChange(maskTelefoneInput(e.target.value))}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
          <p className="text-xs text-muted-foreground">
            Opcional. Ex.: WhatsApp alternativo ou telefone comercial.
          </p>
          {errors.segundoTelefone && (
            <p role="alert" className="text-sm text-destructive">
              {errors.segundoTelefone.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register('email')} />
          {errors.email && (
            <p role="alert" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="cpfCnpj">CPF / CNPJ</Label>
          <Controller
            control={control}
            name="cpfCnpj"
            render={({ field }) => (
              <Input
                id="cpfCnpj"
                inputMode="numeric"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                aria-invalid={!!errors.cpfCnpj}
                value={formatCpfCnpj(field.value ?? '')}
                onChange={(e) => field.onChange(formatCpfCnpj(e.target.value))}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
          <p className="text-xs text-muted-foreground">
            11 dígitos para CPF, 14 dígitos para CNPJ. A máscara se ajusta automaticamente.
          </p>
          {errors.cpfCnpj && (
            <p role="alert" className="text-sm text-destructive">
              {errors.cpfCnpj.message}
            </p>
          )}
        </div>

        {/* ── Endereço estruturado ────────────────────────────────── */}
        <fieldset className="space-y-4 md:col-span-2">
          <legend className="text-sm font-semibold text-foreground">Endereço</legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="cep">CEP</Label>
              <div className="flex gap-2">
                <Input
                  id="cep"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  placeholder="00000-000"
                  aria-invalid={!!errors.cep}
                  {...cepReg}
                  onKeyDown={(e) => {
                    // Enter no CEP busca o endereço em vez de enviar o formulário.
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      void buscarCepAtual()
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => void buscarCepAtual()}
                  disabled={buscandoCep}
                  aria-label="Buscar endereço pelo CEP"
                  title="Buscar endereço pelo CEP"
                >
                  {buscandoCep ? <Loader2 className="animate-spin" /> : <Search />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Digite o CEP e clique na lupa (ou Enter) para preencher o endereço.
              </p>
              {errors.cep && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.cep.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-4">
              <Label htmlFor="logradouro">Logradouro</Label>
              <Input
                id="logradouro"
                autoComplete="address-line1"
                placeholder="Rua, avenida…"
                aria-invalid={!!errors.logradouro}
                {...register('logradouro')}
              />
              {errors.logradouro && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.logradouro.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                autoComplete="address-line2"
                placeholder="123 / S/N"
                aria-invalid={!!errors.numero}
                {...register('numero')}
              />
              {errors.numero && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.numero.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-4">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                aria-invalid={!!errors.bairro}
                {...register('bairro')}
              />
              {errors.bairro && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.bairro.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-4">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                autoComplete="address-level2"
                aria-invalid={!!errors.cidade}
                {...register('cidade')}
              />
              {errors.cidade && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.cidade.message}
                </p>
              )}
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="uf">UF</Label>
              <Input
                id="uf"
                maxLength={2}
                autoComplete="address-level1"
                placeholder="PR"
                className="uppercase"
                aria-invalid={!!errors.uf}
                {...register('uf')}
              />
              {errors.uf && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.uf.message}
                </p>
              )}
            </div>
          </div>
        </fieldset>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            rows={3}
            placeholder="Anotações internas sobre o cliente (preferências, histórico, etc.)"
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
