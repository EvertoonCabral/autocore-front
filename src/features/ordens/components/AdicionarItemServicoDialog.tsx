import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatBRL } from '@/lib/format'
import { useListarServicos } from '@/features/servicos/hooks/useListarServicos'
import {
  adicionarItemServicoSchema,
  type AdicionarItemServicoFormValues,
} from '../helpers/ordemSchemas'
import { useAdicionarItemServico } from '../hooks/useItensServico'

interface Props {
  ordemId: number
}

export function AdicionarItemServicoDialog({ ordemId }: Props) {
  const [open, setOpen] = useState(false)
  const { data: servicos } = useListarServicos(false)
  const adicionar = useAdicionarItemServico()

  const ativos = (servicos ?? []).filter((s) => s.ativo)

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AdicionarItemServicoFormValues>({
    resolver: zodResolver(adicionarItemServicoSchema),
    defaultValues: { quantidade: 1, catalogoServicoId: 0 as unknown as number },
  })

  async function onSubmit(values: AdicionarItemServicoFormValues) {
    try {
      await adicionar.mutateAsync({ ordemId, values })
      toast.success('Serviço adicionado à OS.')
      setOpen(false)
      reset({ quantidade: 1, catalogoServicoId: 0 as unknown as number })
    } catch (err) {
      const apiErr = err as { message?: string }
      toast.error(apiErr.message ?? 'Não foi possível adicionar o serviço.')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (o) reset({ quantidade: 1, catalogoServicoId: 0 as unknown as number })
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4" />
          Adicionar serviço
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar item de serviço</DialogTitle>
          <DialogDescription>
            O nome e o preço do catálogo são copiados como snapshot — alterações futuras no
            catálogo não afetam itens já adicionados.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-2">
            <Label>Serviço *</Label>
            <Controller
              control={control}
              name="catalogoServicoId"
              render={({ field }) => (
                <Select
                  {...(field.value ? { value: String(field.value) } : {})}
                  onValueChange={(v) => field.onChange(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ativos.length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        Nenhum serviço ativo no catálogo.
                      </div>
                    )}
                    {ativos.map((s) => (
                      <SelectItem key={s.id ?? `srv-${s.nome}`} value={String(s.id)}>
                        <span className="flex items-center justify-between gap-3">
                          <span>{s.nome}</span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {formatBRL(s.preco ?? 0)}
                          </span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.catalogoServicoId && (
              <p role="alert" className="text-sm text-destructive">
                {errors.catalogoServicoId.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade *</Label>
            <Input
              id="quantidade"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              aria-invalid={!!errors.quantidade}
              {...register('quantidade')}
            />
            {errors.quantidade && (
              <p role="alert" className="text-sm text-destructive">
                {errors.quantidade.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
