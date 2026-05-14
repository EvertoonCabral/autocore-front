import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { formatCpfCnpj, maskTelefoneInput, onlyDigits } from '@/lib/format'
import { clienteSchema, type ClienteFormValues } from '../helpers/clienteSchema'

interface ClienteFormProps {
  /** Valores iniciais (em modo edição). */
  defaultValues?: Partial<ClienteFormValues>
  submitLabel?: string
  onSubmit: (values: ClienteFormValues) => Promise<void>
  /** Disparado pelo botão Cancelar. */
  onCancel?: () => void
}

export function ClienteForm({
  defaultValues,
  submitLabel = 'Salvar',
  onSubmit,
  onCancel,
}: ClienteFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: '',
      telefone: '',
      email: '',
      cpfCnpj: '',
      endereco: '',
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
        email: defaultValues.email ?? '',
        cpfCnpj: formatCpfCnpj(defaultValues.cpfCnpj ?? ''),
        endereco: defaultValues.endereco ?? '',
        observacoes: defaultValues.observacoes ?? '',
      })
    }
  }, [defaultValues, reset])

  async function submit(values: ClienteFormValues) {
    // Strip máscaras antes de enviar — back exige somente dígitos
    const payload: ClienteFormValues = {
      ...values,
      telefone: onlyDigits(values.telefone),
      cpfCnpj: values.cpfCnpj ? onlyDigits(values.cpfCnpj) : values.cpfCnpj,
    }
    try {
      await onSubmit(payload)
    } catch (err: unknown) {
      const apiErr = err as { kind?: string; detalhes?: string[] }
      if (apiErr.kind === 'validation' && apiErr.detalhes) {
        for (const detalhe of apiErr.detalhes) {
          if (/nome/i.test(detalhe)) setError('nome', { message: detalhe })
          else if (/telefone/i.test(detalhe)) setError('telefone', { message: detalhe })
          else if (/e-?mail/i.test(detalhe)) setError('email', { message: detalhe })
          else if (/cpf|cnpj/i.test(detalhe)) setError('cpfCnpj', { message: detalhe })
          else if (/endere/i.test(detalhe)) setError('endereco', { message: detalhe })
          else if (/observ/i.test(detalhe)) setError('observacoes', { message: detalhe })
        }
      }
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

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="endereco">Endereço</Label>
          <Textarea id="endereco" rows={2} aria-invalid={!!errors.endereco} {...register('endereco')} />
          {errors.endereco && (
            <p role="alert" className="text-sm text-destructive">
              {errors.endereco.message}
            </p>
          )}
        </div>

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
