import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  nomeEmpresaSchema,
  type NomeEmpresaFormValues,
} from '../helpers/configuracaoEmpresaSchema'
import { useAtualizarNomeEmpresa } from '../hooks/useAtualizarNomeEmpresa'
import type { ConfiguracaoEmpresaDto } from '@/api/types'

interface Props {
  configuracao: ConfiguracaoEmpresaDto
}

export function SecaoNomeEmpresa({ configuracao }: Props) {
  const [genericError, setGenericError] = useState<string | null>(null)
  const atualizar = useAtualizarNomeEmpresa()

  const initial: NomeEmpresaFormValues = {
    nomeEmpresa: configuracao.nomeEmpresa ?? '',
  }

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<NomeEmpresaFormValues>({
    resolver: zodResolver(nomeEmpresaSchema),
    defaultValues: initial,
  })

  // Sincroniza o form quando a query refetcha (após mutation, refresh externo).
  useEffect(() => {
    reset({ nomeEmpresa: configuracao.nomeEmpresa ?? '' })
  }, [reset, configuracao.nomeEmpresa])

  async function submit(values: NomeEmpresaFormValues) {
    setGenericError(null)
    try {
      await atualizar.mutateAsync({ nomeEmpresa: values.nomeEmpresa })
      toast.success('Nome da empresa atualizado.')
      reset({ nomeEmpresa: values.nomeEmpresa })
    } catch (err: unknown) {
      const apiErr = err as { kind?: string; message?: string; detalhes?: string[] }
      if (apiErr.kind === 'validation' && apiErr.detalhes && apiErr.detalhes.length > 0) {
        let distributed = false
        for (const detalhe of apiErr.detalhes) {
          if (/nome/i.test(detalhe)) {
            setError('nomeEmpresa', { message: detalhe })
            distributed = true
          }
        }
        if (!distributed) toast.error(apiErr.detalhes.join(' '))
      } else {
        const msg = apiErr.message ?? 'Não foi possível salvar o nome.'
        setGenericError(msg)
        toast.error(msg)
      }
    }
  }

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="max-w-3xl space-y-4 rounded-md border bg-card p-6"
      noValidate
    >
      <div>
        <h3 className="text-base font-semibold">Identidade da empresa</h3>
        <p className="text-sm text-muted-foreground">
          O nome aparece em PDFs, emails e como fallback no cabeçalho quando não há logo.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="nomeEmpresa">Nome da empresa *</Label>
        <Input
          id="nomeEmpresa"
          type="text"
          autoComplete="off"
          aria-invalid={!!errors.nomeEmpresa}
          {...register('nomeEmpresa')}
        />
        {errors.nomeEmpresa && (
          <p role="alert" className="text-sm text-destructive">
            {errors.nomeEmpresa.message}
          </p>
        )}
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
