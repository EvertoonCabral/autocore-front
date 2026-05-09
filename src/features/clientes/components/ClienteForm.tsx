import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { onlyDigits } from '@/lib/format'
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
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nome: '',
      telefone: '',
      email: '',
      cpf: '',
      endereco: '',
      ...defaultValues,
    },
  })

  // Atualiza o form quando defaultValues chegam tarde (modo edição com fetch).
  useEffect(() => {
    if (defaultValues) {
      reset({
        nome: defaultValues.nome ?? '',
        telefone: defaultValues.telefone ?? '',
        email: defaultValues.email ?? '',
        cpf: defaultValues.cpf ?? '',
        endereco: defaultValues.endereco ?? '',
      })
    }
  }, [defaultValues, reset])

  async function submit(values: ClienteFormValues) {
    try {
      await onSubmit(values)
    } catch (err: unknown) {
      const apiErr = err as { kind?: string; detalhes?: string[] }
      if (apiErr.kind === 'validation' && apiErr.detalhes) {
        // 422 — distribui detalhes por campo via heurística simples
        for (const detalhe of apiErr.detalhes) {
          if (/nome/i.test(detalhe)) setError('nome', { message: detalhe })
          else if (/telefone/i.test(detalhe)) setError('telefone', { message: detalhe })
          else if (/e-?mail/i.test(detalhe)) setError('email', { message: detalhe })
          else if (/cpf/i.test(detalhe)) setError('cpf', { message: detalhe })
          else if (/endere/i.test(detalhe)) setError('endereco', { message: detalhe })
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
          <Input
            id="telefone"
            inputMode="tel"
            autoComplete="tel"
            placeholder="44999990000"
            aria-invalid={!!errors.telefone}
            {...register('telefone', {
              onBlur: (e) => setValue('telefone', onlyDigits(e.target.value), { shouldValidate: true }),
            })}
          />
          <p className="text-xs text-muted-foreground">
            Apenas dígitos (com DDD). Ex.: 44999990000.
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
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            inputMode="numeric"
            placeholder="11 dígitos"
            aria-invalid={!!errors.cpf}
            {...register('cpf', {
              onBlur: (e) => setValue('cpf', onlyDigits(e.target.value), { shouldValidate: true }),
            })}
          />
          {errors.cpf && (
            <p role="alert" className="text-sm text-destructive">
              {errors.cpf.message}
            </p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="endereco">Endereço</Label>
          <Textarea id="endereco" rows={3} aria-invalid={!!errors.endereco} {...register('endereco')} />
          {errors.endereco && (
            <p role="alert" className="text-sm text-destructive">
              {errors.endereco.message}
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
